-- 1. Drop existing policies if any
DROP POLICY IF EXISTS "Voice notes select" ON public.voice_notes;
DROP POLICY IF EXISTS "Voice notes insert" ON public.voice_notes;

-- 2. Create SELECT policy (View voice notes if you can access the candidate)
CREATE POLICY "Voice notes select" ON public.voice_notes
    FOR SELECT USING (
        public.can_access_candidate(candidate_id)
    );

-- 3. Create INSERT policy (Add voice notes if you can access the candidate)
CREATE POLICY "Voice notes insert" ON public.voice_notes
    FOR INSERT WITH CHECK (
        public.can_access_candidate(candidate_id)
    );

-- 4. Re-grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_notes TO authenticated;
