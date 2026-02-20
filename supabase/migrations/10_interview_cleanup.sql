-- 1. Add missing interviewer_id column
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS interviewer_id UUID;

-- 2. Drop existing SELECT policy
DROP POLICY IF EXISTS "Interviews select" ON public.interviews;
DROP POLICY IF EXISTS "Interviews view" ON public.interviews;

-- 3. Create a more robust and direct SELECT policy (avoiding function overhead where possible)
CREATE POLICY "Interviews select" ON public.interviews
    FOR SELECT USING (
        -- User owns the company the position belongs to
        position_id IN (
            SELECT p.id FROM public.positions p
            JOIN public.companies c ON p.company_id = c.id
            WHERE c.user_id = auth.uid()
        )
        OR
        -- User is a team member of the company
        position_id IN (
            SELECT p.id FROM public.positions p
            JOIN public.team_members tm ON p.company_id = tm.company_id
            WHERE tm.user_id = auth.uid()
        )
        OR
        -- User is on the interview panel
        EXISTS (
            SELECT 1 FROM public.interview_panel
            WHERE interview_id = public.interviews.id
            AND user_id = auth.uid()
        )
    );

-- 4. Re-grant permissions just in case
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
