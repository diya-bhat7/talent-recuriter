-- 1. Drop existing policies if any (to be safe)
DROP POLICY IF EXISTS "Team members can access interview_candidates" ON public.interview_candidates;
DROP POLICY IF EXISTS "Interview panel access" ON public.interview_panel;

-- 2. Create GRANULAR policies for interview_candidates
CREATE POLICY "interview_candidates_select" ON public.interview_candidates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.is_interview_accessible(i.id)
        )
    );

CREATE POLICY "interview_candidates_insert" ON public.interview_candidates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.can_manage_position(i.position_id)
        )
    );

CREATE POLICY "interview_candidates_all" ON public.interview_candidates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.can_manage_interview(i.id)
        )
    );

-- 3. Create GRANULAR policies for interview_panel
CREATE POLICY "interview_panel_select" ON public.interview_panel
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND (public.is_interview_accessible(i.id) OR auth.uid() = user_id)
        )
    );

CREATE POLICY "interview_panel_insert" ON public.interview_panel
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.can_manage_position(i.position_id)
        )
    );

CREATE POLICY "interview_panel_all" ON public.interview_panel
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            WHERE i.id = interview_id
            AND public.can_manage_interview(i.id)
        )
    );

-- 4. Re-grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_panel TO authenticated;
