-- ============================================
-- SUPABASE DATABASE FUNCTIONS SETUP
-- ============================================
-- This script contains all custom functions, triggers,
-- and security helpers for the hiring platform.
-- ============================================

-- ============================================
-- 1. UTILITY FUNCTIONS (Invoker)
-- ============================================

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate mention tags (Valorant style: Name#1234)
CREATE OR REPLACE FUNCTION public.generate_mention_tag(p_name TEXT, p_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN REGEXP_REPLACE(COALESCE(p_name, 'user'), '\s+', '', 'g') || '#' || LEFT(p_id::TEXT, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to search candidates by skill
CREATE OR REPLACE FUNCTION public.search_candidates_by_skill(skill_query TEXT)
RETURNS SETOF public.candidates AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.candidates
    WHERE skill_query = ANY(skills);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. SECURITY HELPER FUNCTIONS (Security Definer)
-- These bypass RLS to perform safe permission checks.
-- ============================================

-- Check if user is the primary owner of a company
CREATE OR REPLACE FUNCTION public.is_company_owner(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = cid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user is a member/employee of a company
CREATE OR REPLACE FUNCTION public.is_member_of_company(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE company_id = cid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Combined check: Owner OR Member
CREATE OR REPLACE FUNCTION public.check_user_can_access_company(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_company_owner(cid) OR public.is_member_of_company(cid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Alias for check_user_can_access_company
CREATE OR REPLACE FUNCTION public.is_company_access_allowed(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_user_can_access_company(cid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user has a specific role in a company
CREATE OR REPLACE FUNCTION public.check_user_role_in_company(cid UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE company_id = cid 
    AND user_id = auth.uid() 
    AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get list of owned company IDs
CREATE OR REPLACE FUNCTION public.get_my_owned_company_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT id FROM public.companies WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get list of team company IDs
CREATE OR REPLACE FUNCTION public.get_my_team_company_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT company_id FROM public.team_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 3. INTERVIEW SECURITY FUNCTIONS (Definer)
-- ============================================

-- Check if user is on the interview panel
CREATE OR REPLACE FUNCTION public.is_panelist_for_interview(iid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.interview_panel
    WHERE interview_id = iid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Strict accessibility check (Ownership, Team, Panel)
CREATE OR REPLACE FUNCTION public.is_interview_accessible(iid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Get company_id via interview -> position
  SELECT p.company_id INTO v_company_id
  FROM public.interviews i
  JOIN public.positions p ON i.position_id = p.id
  WHERE i.id = iid;

  RETURN public.check_user_can_access_company(v_company_id) 
    OR public.is_panelist_for_interview(iid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aliases for interview access
CREATE OR REPLACE FUNCTION public.check_user_can_access_interview(iid UUID) RETURNS BOOLEAN AS $$ BEGIN RETURN public.is_interview_accessible(iid); END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.is_interview_access_allowed(iid UUID) RETURNS BOOLEAN AS $$ BEGIN RETURN public.is_interview_accessible(iid); END; $$ LANGUAGE plpgsql;

-- Check for administrative management of an interview
CREATE OR REPLACE FUNCTION public.can_manage_interview(iid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT p.company_id INTO v_company_id
  FROM public.interviews i
  JOIN public.positions p ON i.position_id = p.id
  WHERE i.id = iid;

  RETURN public.is_company_owner(v_company_id) 
    OR public.check_user_role_in_company(v_company_id, ARRAY['admin', 'recruiter']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 4. TRIGGER FUNCTIONS
-- ============================================

-- Sync Auth users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_mention_tag TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_mention_tag := public.generate_mention_tag(v_name, NEW.id);

    INSERT INTO public.profiles (id, name, email, mention_tag, avatar_url)
    VALUES (NEW.id, v_name, NEW.email, v_mention_tag, NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Handle Hired Candidate logic
CREATE OR REPLACE FUNCTION public.handle_candidate_hired()
RETURNS TRIGGER AS $$
DECLARE
  target_roles INT;
  current_hired INT;
BEGIN
  IF OLD.status IS DISTINCT FROM 'hired' AND NEW.status = 'hired' THEN
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

-- Update Mention Tag Trigger
CREATE OR REPLACE FUNCTION public.trg_update_mention_tag() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.mention_tag := public.generate_mention_tag(NEW.name, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update Company Mention Tag Trigger
CREATE OR REPLACE FUNCTION public.trg_update_company_mention_tag() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.mention_tag := public.generate_mention_tag(NEW.company_name, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGER DEFINITIONS
-- ============================================

-- Auth Sync Trigger
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- Candidate Hired Trigger
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_candidate_hired') THEN
        CREATE TRIGGER on_candidate_hired
        AFTER UPDATE ON public.candidates
        FOR EACH ROW EXECUTE FUNCTION public.handle_candidate_hired();
    END IF;
END $$;

-- Mention Tag Triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_candidates_mention_tag') THEN
        CREATE TRIGGER trg_candidates_mention_tag
        BEFORE INSERT OR UPDATE ON public.candidates
        FOR EACH ROW EXECUTE FUNCTION public.trg_update_mention_tag();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_companies_mention_tag') THEN
        CREATE TRIGGER trg_companies_mention_tag
        BEFORE INSERT OR UPDATE ON public.companies
        FOR EACH ROW EXECUTE FUNCTION public.trg_update_company_mention_tag();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trg_team_members_mention_tag') THEN
        CREATE TRIGGER trg_team_members_mention_tag
        BEFORE INSERT OR UPDATE ON public.team_members
        FOR EACH ROW EXECUTE FUNCTION public.trg_update_mention_tag();
    END IF;
END $$;

-- Updated At Triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_submissions_updated_at') THEN
        CREATE TRIGGER update_submissions_updated_at
        BEFORE UPDATE ON public.submissions
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- FINAL GRANTS
-- ============================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
