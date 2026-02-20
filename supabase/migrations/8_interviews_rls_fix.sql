-- 1. Helper function to check if user can manage a position (needed for interview insert)
CREATE OR REPLACE FUNCTION public.can_manage_position(pid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT company_id INTO v_company_id FROM public.positions WHERE id = pid;
    -- check_user_role_in_company handles owner + roles check
    RETURN public.check_user_role_in_company(v_company_id, ARRAY['admin', 'recruiter']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Interviews manage" ON public.interviews;
DROP POLICY IF EXISTS "Interviews view" ON public.interviews;

-- 3. Create granular policies for interviews
CREATE POLICY "Interviews select" ON public.interviews
    FOR SELECT USING (public.is_interview_accessible(id));

CREATE POLICY "Interviews insert" ON public.interviews
    FOR INSERT WITH CHECK (public.can_manage_position(position_id));

CREATE POLICY "Interviews update" ON public.interviews
    FOR UPDATE USING (public.can_manage_interview(id))
    WITH CHECK (public.can_manage_interview(id));

CREATE POLICY "Interviews delete" ON public.interviews
    FOR DELETE USING (public.can_manage_interview(id));

-- 4. Apply similar logic to interview_panel and interview_candidates if needed
-- (They already exist but might need similar insert fixes if they fail)
