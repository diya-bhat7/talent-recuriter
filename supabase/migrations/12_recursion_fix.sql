-- 1. Helper to check interview panel membership without triggering RLS
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

-- 2. Master "Can View Interview" check (Atomic and Non-Recursive)
CREATE OR REPLACE FUNCTION public.check_can_view_interview(iid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_pos_id UUID;
    v_comp_id UUID;
BEGIN
    -- Get position and company directly from interviews base table
    SELECT position_id INTO v_pos_id FROM public.interviews WHERE id = iid;
    IF v_pos_id IS NULL THEN RETURN FALSE; END IF;
    
    SELECT company_id INTO v_comp_id FROM public.positions WHERE id = v_pos_id;
    IF v_comp_id IS NULL THEN RETURN FALSE; END IF;

    RETURN (
        public.is_member_of_company(v_comp_id) -- Checks ownership/team
        OR 
        public.is_user_in_interview_panel(iid, auth.uid()) -- Checks panel
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Redefine Interviews Policies
DROP POLICY IF EXISTS "Interviews select" ON public.interviews;
DROP POLICY IF EXISTS "Interviews view" ON public.interviews;

CREATE POLICY "interviews_select_safe" ON public.interviews
    FOR SELECT USING (public.check_can_view_interview(id));

-- 4. Redefine Interview Panel Policies
DROP POLICY IF EXISTS "interview_panel_select" ON public.interview_panel;
DROP POLICY IF EXISTS "Interview panel access" ON public.interview_panel;

CREATE POLICY "interview_panel_select_safe" ON public.interview_panel
    FOR SELECT USING (
        user_id = auth.uid() -- Can always see your own panel entries
        OR 
        EXISTS (
            -- Check if user can manage the interview's parent position
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.check_can_view_interview(i.id)
        )
    );

-- 5. Redefine Interview Candidates Policies
DROP POLICY IF EXISTS "interview_candidates_select" ON public.interview_candidates;
DROP POLICY IF EXISTS "Interview candidates access" ON public.interview_candidates;

CREATE POLICY "interview_candidates_select_safe" ON public.interview_candidates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.check_can_view_interview(i.id)
        )
    );
