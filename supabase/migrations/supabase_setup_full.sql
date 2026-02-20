-- ============================================
-- COMPREHENSIVE SUPABASE SETUP SCRIPT
-- ============================================
-- This script sets up the entire database from scratch.
-- Includes: Profiles, Companies, Positions, Candidates, Interviews,
-- Scoring, Comments, Notifications, Storage, and RLS.
-- ============================================

-- ============================================
-- 0. CLEAN SLATE: DROP EVERYTHING
-- ============================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all triggers in public schema
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.event_object_table);
    END LOOP;

    -- Drop all policies in public schema
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_mention_tag(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.search_candidates_by_skill(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_interview_accessible(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_interview(uuid) CASCADE;

DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.voice_notes CASCADE;
DROP TABLE IF EXISTS public.scorecards CASCADE;
DROP TABLE IF EXISTS public.interview_guides CASCADE;
DROP TABLE IF EXISTS public.scorecard_templates CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.interview_panel CASCADE;
DROP TABLE IF EXISTS public.interview_candidates CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.positions CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;

-- ============================================
-- 1. UTILITY FUNCTIONS
-- ============================================

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate mention tags (Valorant style: Name#1234)
CREATE OR REPLACE FUNCTION public.generate_mention_tag(p_name TEXT, p_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN REGEXP_REPLACE(p_name, '\s+', '', 'g') || '#' || LEFT(p_id::TEXT, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 2. CORE TABLES
-- ============================================

-- Profiles (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    mention_tag TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions (Airtable Sync)
CREATE TABLE public.submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    airtable_id TEXT,
    sync_to_airtable BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'form',
    sync_status TEXT DEFAULT 'pending',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Companies
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_website TEXT,
    company_linkedin TEXT,
    office_locations TEXT[] DEFAULT '{}',
    contact_email TEXT NOT NULL,
    contact_title TEXT,
    contact_name TEXT NOT NULL,
    mention_tag TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Team Members
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer', -- viewer, recruiter, admin
    mention_tag TEXT,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- Positions
CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    position_name TEXT NOT NULL,
    category TEXT NOT NULL,
    min_experience INTEGER NOT NULL DEFAULT 0,
    max_experience INTEGER NOT NULL DEFAULT 0,
    work_type TEXT NOT NULL DEFAULT 'In-Office',
    preferred_locations TEXT[] DEFAULT '{}',
    in_office_days INTEGER,
    num_roles INTEGER NOT NULL DEFAULT 1,
    priority TEXT NOT NULL DEFAULT 'Medium',
    hiring_start_date DATE,
    closing_date DATE,
    client_jd_text TEXT,
    client_jd_file_url TEXT,
    key_requirements TEXT,
    generated_jd TEXT,
    interview_prep_doc TEXT,
    hired_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    resume_url TEXT,
    linkedin_url TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    experience_years INTEGER DEFAULT 0,
    skills TEXT[] DEFAULT '{}',
    mention_tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. HIRING WORKFLOW
-- ============================================

-- Interviews
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE, -- Optional if group interview
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  interview_type TEXT,
  interviewer_id UUID,
  is_collaborative BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  meeting_link TEXT,
  meeting_platform TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Interview Candidates (Join Table for Multi-Candidate Support)
CREATE TABLE public.interview_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(interview_id, candidate_id)
);

-- Interview Panel (Join Table for Multiple Interviewers)
CREATE TABLE public.interview_panel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'interviewer',
    UNIQUE(interview_id, user_id)
);

-- Scorecard Templates
CREATE TABLE public.scorecard_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Guides
CREATE TABLE public.interview_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scorecards
CREATE TABLE public.scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.scorecard_templates(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    interview_type TEXT,
    tech_rating INTEGER,
    comm_rating INTEGER,
    culture_rating INTEGER,
    scores JSONB NOT NULL DEFAULT '{}',
    overall_score NUMERIC(3,2),
    notes TEXT,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    mentions TEXT[] DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Notes
CREATE TABLE public.voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER,
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'mention', 'activity', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Activity Log
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_name TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TRIGGERS & AUTO-SYNC
-- ============================================

-- Profile Sync Function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth Sync Trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated At Triggers
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interview_guides_updated_at BEFORE UPDATE ON public.interview_guides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mention Tag Triggers
CREATE OR REPLACE FUNCTION public.trg_update_mention_tag() RETURNS TRIGGER AS $$
BEGIN
    NEW.mention_tag := public.generate_mention_tag(NEW.name, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidates_mention_tag BEFORE INSERT OR UPDATE OF name ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.trg_update_mention_tag();
CREATE TRIGGER trg_team_members_mention_tag BEFORE INSERT OR UPDATE OF name ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.trg_update_mention_tag();

-- ============================================
-- 6. RLS SECURITY (MASTER VERSION)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_panel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Security Definer Helpers (To avoid recursion)

-- Check if user is a member/employee of a company (including owner)
CREATE OR REPLACE FUNCTION public.is_member_of_company(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = cid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.team_members
    WHERE company_id = cid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper to check interview panel membership
CREATE OR REPLACE FUNCTION public.is_user_in_interview_panel(iid UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.interview_panel 
        WHERE interview_id = iid 
        AND user_id = uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Master "Can View Interview" check (Atomic and Non-Recursive)
CREATE OR REPLACE FUNCTION public.check_can_view_interview(iid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_pos_id UUID;
    v_comp_id UUID;
BEGIN
    SELECT position_id INTO v_pos_id FROM public.interviews WHERE id = iid;
    IF v_pos_id IS NULL THEN RETURN FALSE; END IF;
    
    SELECT company_id INTO v_comp_id FROM public.positions WHERE id = v_pos_id;
    IF v_comp_id IS NULL THEN RETURN FALSE; END IF;

    RETURN (
        public.is_member_of_company(v_comp_id)
        OR 
        public.is_user_in_interview_panel(iid, auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user can access a candidate's data
CREATE OR REPLACE FUNCTION public.can_access_candidate(cand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_pos_id UUID;
    v_comp_id UUID;
BEGIN
    SELECT position_id INTO v_pos_id FROM public.candidates WHERE id = cand_id;
    IF v_pos_id IS NULL THEN RETURN FALSE; END IF;

    SELECT company_id INTO v_comp_id FROM public.positions WHERE id = v_pos_id;
    IF v_comp_id IS NULL THEN RETURN FALSE; END IF;

    RETURN public.is_member_of_company(v_comp_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_interview_accessible(iid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_can_view_interview(iid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_interview(iid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_pos_id UUID;
  v_comp_id UUID;
BEGIN
  SELECT position_id INTO v_pos_id FROM public.interviews WHERE id = iid;
  IF v_pos_id IS NULL THEN RETURN FALSE; END IF;
  
  SELECT company_id INTO v_comp_id FROM public.positions WHERE id = v_pos_id;
  IF v_comp_id IS NULL THEN RETURN FALSE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies WHERE id = v_comp_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE company_id = v_comp_id AND user_id = auth.uid() AND role IN ('admin', 'recruiter')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- APPLY POLICIES

CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Companies access" ON public.companies FOR SELECT USING (public.is_member_of_company(id));
CREATE POLICY "Companies manage" ON public.companies FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Team membership access" ON public.team_members FOR SELECT USING (public.is_member_of_company(company_id));

CREATE POLICY "Positions access" ON public.positions FOR ALL USING (public.is_member_of_company(company_id));

CREATE POLICY "Candidates access" ON public.candidates FOR ALL USING (public.can_access_candidate(id));

CREATE POLICY "Interviews view" ON public.interviews FOR SELECT USING (public.check_can_view_interview(id));
CREATE POLICY "Interviews manage" ON public.interviews FOR ALL USING (public.can_manage_interview(id));

CREATE POLICY "Comments access" ON public.comments FOR ALL USING (public.is_member_of_company(company_id));

CREATE POLICY "Interview guides access" ON public.interview_guides FOR ALL USING (public.is_member_of_company(company_id));

CREATE POLICY "Scorecard templates access" ON public.scorecard_templates FOR ALL USING (public.is_member_of_company(company_id));

CREATE POLICY "Activity log access" ON public.activity_log FOR SELECT USING (public.is_member_of_company(company_id));

CREATE POLICY "Interview panel access" ON public.interview_panel FOR ALL USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.interviews i
        WHERE i.id = interview_id
        AND public.check_can_view_interview(i.id)
    )
);

CREATE POLICY "Interview candidates access" ON public.interview_candidates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.interviews i
        WHERE i.id = interview_id
        AND public.check_can_view_interview(i.id)
    )
);

CREATE POLICY "Public submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Submissions view" ON public.submissions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Voice notes access" ON public.voice_notes FOR ALL USING (public.can_access_candidate(candidate_id));

CREATE POLICY "Scorecards access" ON public.scorecards FOR ALL USING (public.can_access_candidate(candidate_id));

CREATE POLICY "Notifications access" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================

-- Note: These must be run in SQL Editor if not using extensions
-- This is a representative setup for manual configuration reference:
-- Buckets: 'voice-notes', 'resumes', 'company-logos', 'candidates'

-- ============================================
-- 8. INDEXES & REALTIME
-- ============================================

CREATE INDEX idx_candidates_skills ON public.candidates USING GIN(skills);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_activity_log_company ON public.activity_log(company_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates, public.interviews, public.comments, public.notifications;

-- ============================================
-- 9. GRANTS & PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role, authenticated;

-- ============================================
-- FINISHED!
-- ============================================
