-- ============================================
-- SUPABASE FUNCTION SETUP (VERSION 2)
-- Goal: Comprehensive utility, sync, and security functions. 
-- Fix: Automatic company creation during signup via handle_new_user.
-- ============================================

-- 1. UTILITY FUNCTIONS
-- ============================================

-- Auto-update 'updated_at' column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate mention tags (Name#1234)
DROP FUNCTION IF EXISTS public.generate_mention_tag(text, uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.generate_mention_tag(p_name TEXT, p_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN REGEXP_REPLACE(p_name, '\s+', '', 'g') || '#' || LEFT(p_id::TEXT, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Search candidates by skill
DROP FUNCTION IF EXISTS public.search_candidates_by_skill(text);
CREATE OR REPLACE FUNCTION public.search_candidates_by_skill(p_skill TEXT)
RETURNS SETOF public.candidates AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.candidates
    WHERE p_skill = ANY(skills);
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. SYNC & AUTOMATION
-- ============================================

-- Unified Handle New User (Profiles + Companies)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_mention_tag TEXT;
    v_company_name TEXT;
    v_company_id UUID;
BEGIN
    -- Extract Name
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_mention_tag := public.generate_mention_tag(v_name, NEW.id);

    -- 1. Create Profile
    INSERT INTO public.profiles (id, name, email, mention_tag, avatar_url)
    VALUES (NEW.id, v_name, NEW.email, v_mention_tag, NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        email = EXCLUDED.email, 
        updated_at = now();

    -- 2. Create Company if metadata exists (Owner Flow)
    v_company_name := NEW.raw_user_meta_data->>'company_name';
    
    IF v_company_name IS NOT NULL THEN
        INSERT INTO public.companies (
            user_id, 
            company_name, 
            company_website, 
            company_linkedin, 
            office_locations, 
            contact_email, 
            contact_title, 
            contact_name
        ) VALUES (
            NEW.id,
            v_company_name,
            NEW.raw_user_meta_data->>'company_website',
            NEW.raw_user_meta_data->>'company_linkedin',
            (SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'office_locations'))),
            COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email),
            NEW.raw_user_meta_data->>'contact_title',
            NEW.raw_user_meta_data->>'contact_name'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            updated_at = now()
        RETURNING id INTO v_company_id;

        -- 3. Add Owner to Team Members as Admin
        IF v_company_id IS NOT NULL THEN
            INSERT INTO public.team_members (company_id, user_id, email, name, role)
            VALUES (v_company_id, NEW.id, NEW.email, v_name, 'admin')
            ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'admin';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for Mention Tags on Candidates
CREATE OR REPLACE FUNCTION public.trg_update_mention_tag() RETURNS TRIGGER AS $$
BEGIN
    NEW.mention_tag := public.generate_mention_tag(NEW.name, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidates_mention_tag ON public.candidates;
CREATE TRIGGER trg_candidates_mention_tag 
BEFORE INSERT OR UPDATE OF name ON public.candidates 
FOR EACH ROW EXECUTE FUNCTION public.trg_update_mention_tag();

-- 3. SECURITY DEFINER FUNCTIONS (RLS BREAKERS)
-- ============================================

-- General Company Access
DROP FUNCTION IF EXISTS public.is_company_access_allowed(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_company_access_allowed(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.companies WHERE id = cid AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.team_members WHERE company_id = cid AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Interview Access
DROP FUNCTION IF EXISTS public.is_interview_accessible(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_interview_accessible(iid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_company_id UUID;
  v_owner_id UUID;
BEGIN
  SELECT p.company_id, c.user_id INTO v_company_id, v_owner_id
  FROM public.interviews i
  JOIN public.positions p ON i.position_id = p.id
  JOIN public.companies c ON p.company_id = c.id
  WHERE i.id = iid;

  RETURN (v_owner_id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.team_members WHERE company_id = v_company_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.interview_panel WHERE interview_id = iid AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Manage Interview (Admins/Recruiters)
DROP FUNCTION IF EXISTS public.can_manage_interview(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.can_manage_interview(iid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_company_id UUID;
  v_owner_id UUID;
BEGIN
  SELECT p.company_id, c.user_id INTO v_company_id, v_owner_id
  FROM public.interviews i
  JOIN public.positions p ON i.position_id = p.id
  JOIN public.companies c ON p.company_id = c.id
  WHERE i.id = iid;

  RETURN (v_owner_id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.team_members WHERE company_id = v_company_id AND user_id = auth.uid() AND role IN ('admin', 'recruiter'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get list of companies I own
DROP FUNCTION IF EXISTS public.get_my_owned_company_ids() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_owned_company_ids()
RETURNS TABLE(id UUID) AS $$
BEGIN
    RETURN QUERY SELECT c.id FROM public.companies c WHERE c.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get list of companies where I am a team member
DROP FUNCTION IF EXISTS public.get_my_team_company_ids() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_team_company_ids()
RETURNS TABLE(id UUID) AS $$
BEGIN
    RETURN QUERY SELECT tm.company_id FROM public.team_members tm WHERE tm.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if member of company
DROP FUNCTION IF EXISTS public.is_member_of_company(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_member_of_company(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN cid IN (SELECT public.get_my_owned_company_ids()) 
           OR cid IN (SELECT public.get_my_team_company_ids());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check specific roles
DROP FUNCTION IF EXISTS public.check_user_role_in_company(uuid, text[]) CASCADE;
CREATE OR REPLACE FUNCTION public.check_user_role_in_company(cid UUID, req_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    -- Owners are always allowed
    IF EXISTS (SELECT 1 FROM public.companies WHERE id = cid AND user_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;

    -- Check team member role
    RETURN EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE company_id = cid AND user_id = auth.uid() AND role = ANY(req_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is on the interview panel
DROP FUNCTION IF EXISTS public.is_panelist_for_interview(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_panelist_for_interview(iid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.interview_panel WHERE interview_id = iid AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Candidate Access Filter
DROP FUNCTION IF EXISTS public.can_access_candidate(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.can_access_candidate(can_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_comp_id UUID;
BEGIN
    SELECT p.company_id INTO v_comp_id
    FROM public.candidates c
    JOIN public.positions p ON c.position_id = p.id
    WHERE c.id = can_id;

    RETURN public.is_member_of_company(v_comp_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle Hired Candidate logic (Update Count)
DROP FUNCTION IF EXISTS public.handle_candidate_hired() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_candidate_hired()
RETURNS TRIGGER AS $$
DECLARE
  target_roles INT;
  current_hired INT;
BEGIN
  IF COALESCE(OLD.status, 'new') IS DISTINCT FROM 'hired' AND NEW.status = 'hired' THEN
    UPDATE public.positions
    SET hired_count = hired_count + 1
    WHERE id = NEW.position_id
    RETURNING num_roles, hired_count INTO target_roles, current_hired;
    
    IF current_hired >= target_roles THEN
      UPDATE public.positions SET status = 'closed' WHERE id = NEW.position_id;
    END IF;
  ELSIF OLD.status = 'hired' AND NEW.status IS DISTINCT FROM 'hired' THEN
    UPDATE public.positions
    SET hired_count = greatest(0, hired_count - 1)
    WHERE id = NEW.position_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for hiring
DROP TRIGGER IF EXISTS on_candidate_hired ON public.candidates;
CREATE TRIGGER on_candidate_hired
AFTER UPDATE OF status ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.handle_candidate_hired();
