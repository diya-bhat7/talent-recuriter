-- 1. Create missing interview_candidates table
CREATE TABLE IF NOT EXISTS public.interview_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(interview_id, candidate_id)
);

-- 2. Enable RLS
ALTER TABLE public.interview_candidates ENABLE ROW LEVEL SECURITY;

-- 3. Basic Access Policy (Members can view/edit)
DROP POLICY IF EXISTS "Team members can access interview_candidates" ON public.interview_candidates;
CREATE POLICY "Team members can access interview_candidates" ON public.interview_candidates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.interviews i
            JOIN public.positions p ON i.position_id = p.id
            WHERE i.id = interview_id
            AND public.is_member_of_company(p.company_id)
        )
    );
