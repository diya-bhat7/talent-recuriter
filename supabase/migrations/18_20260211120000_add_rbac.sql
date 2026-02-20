-- Migration: 20260211120000_add_rbac.sql
-- Description: Implement RBAC roles and permissions

BEGIN;

-- 1. Migrate legacy data in team_members
-- Standardize on 'admin', 'recruiter', 'coordinator'
UPDATE public.team_members SET role = 'coordinator' WHERE role = 'viewer';
UPDATE public.team_members SET role = 'recruiter' WHERE role = 'hiring_manager';

-- 2. Helper to get the current user's role in a company
CREATE OR REPLACE FUNCTION public.get_auth_role(cid UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Check if user is the company owner (always admin)
    IF EXISTS (SELECT 1 FROM public.companies WHERE id = cid AND user_id = auth.uid()) THEN
        RETURN 'admin';
    END IF;

    -- Check team membership
    SELECT role INTO v_role FROM public.team_members
    WHERE company_id = cid AND user_id = auth.uid();

    RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update can_manage_interview to include all team roles
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

  -- All team members (admin, recruiter, coordinator) can manage interviews
  RETURN public.is_member_of_company(v_comp_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Refine RLS Policies

-- POSITIONS
-- Admin/Recruiter: ALL
-- Coordinator: SELECT
DROP POLICY IF EXISTS "Positions access" ON public.positions;
CREATE POLICY "Positions select" ON public.positions FOR SELECT USING (public.is_member_of_company(company_id));
CREATE POLICY "Positions manage" ON public.positions FOR INSERT WITH CHECK (public.get_auth_role(company_id) IN ('admin', 'recruiter'));
CREATE POLICY "Positions update" ON public.positions FOR UPDATE USING (public.get_auth_role(company_id) IN ('admin', 'recruiter'));
CREATE POLICY "Positions delete" ON public.positions FOR DELETE USING (public.get_auth_role(company_id) IN ('admin', 'recruiter'));

-- CANDIDATES
-- Admin/Recruiter: ALL
-- Coordinator: SELECT
DROP POLICY IF EXISTS "Candidates access" ON public.candidates;
CREATE POLICY "Candidates select" ON public.candidates FOR SELECT USING (public.can_access_candidate(id));
CREATE POLICY "Candidates manage" ON public.candidates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.positions p
        WHERE p.id = candidates.position_id 
        AND public.get_auth_role(p.company_id) IN ('admin', 'recruiter')
    )
);

-- TEAM MEMBERS
-- Admin: ALL
-- Others: SELECT
DROP POLICY IF EXISTS "Team membership access" ON public.team_members;
CREATE POLICY "Team members select" ON public.team_members FOR SELECT USING (public.is_member_of_company(company_id));
CREATE POLICY "Team members manage" ON public.team_members FOR ALL USING (public.get_auth_role(company_id) = 'admin');

-- COMPANIES
-- Admin: ALL
-- Others: SELECT
DROP POLICY IF EXISTS "Companies access" ON public.companies;
DROP POLICY IF EXISTS "Companies manage" ON public.companies;
CREATE POLICY "Companies select" ON public.companies FOR SELECT USING (public.is_member_of_company(id));
CREATE POLICY "Companies manage" ON public.companies FOR ALL USING (auth.uid() = user_id);

COMMIT;
