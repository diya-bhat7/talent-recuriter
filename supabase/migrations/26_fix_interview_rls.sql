-- Migration: 26_fix_interview_rls.sql
-- Description: Allow all company members to schedule interviews and manage panels/candidates

BEGIN;

-- 1. Update can_manage_position to allow all members to schedule interviews
-- Currently it's restricted to admin/recruiter, which blocks coordinators.
CREATE OR REPLACE FUNCTION public.can_manage_position(pid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT company_id INTO v_company_id FROM public.positions WHERE id = pid;
    -- Allow any member of the company to schedule an interview for a position
    RETURN public.is_member_of_company(v_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ensure interview_panel and interview_candidates have correct INSERT policies
-- They should follow the same logic: if you can view/manage the interview, you can manage its sub-tables.

DROP POLICY IF EXISTS "interview_panel_insert" ON public.interview_panel;
CREATE POLICY "interview_panel_insert" ON public.interview_panel
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.is_member_of_company((SELECT company_id FROM public.positions WHERE id = i.position_id))
        )
    );

DROP POLICY IF EXISTS "interview_candidates_insert" ON public.interview_candidates;
CREATE POLICY "interview_candidates_insert" ON public.interview_candidates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.is_member_of_company((SELECT company_id FROM public.positions WHERE id = i.position_id))
        )
    );

-- 3. Also update update/delete for panel/candidates to be consistent
DROP POLICY IF EXISTS "interview_panel_manage" ON public.interview_panel;
CREATE POLICY "interview_panel_manage" ON public.interview_panel
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.is_member_of_company((SELECT company_id FROM public.positions WHERE id = i.position_id))
        )
    );

DROP POLICY IF EXISTS "interview_candidates_manage" ON public.interview_candidates;
CREATE POLICY "interview_candidates_manage" ON public.interview_candidates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.is_member_of_company((SELECT company_id FROM public.positions WHERE id = i.position_id))
        )
    );

COMMIT;
