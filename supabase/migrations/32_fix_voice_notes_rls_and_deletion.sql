-- Migration: 32_fix_voice_notes_rls_and_deletion.sql
-- Description: Explicitly enable RLS on voice_notes and add robust policies for secure access and deletion.

-- 1. Enable RLS (just in case it was missed)
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing vague or conflicting policies
DROP POLICY IF EXISTS "Voice notes access" ON public.voice_notes;
DROP POLICY IF EXISTS "Voice notes - Authenticated Read" ON public.voice_notes;
DROP POLICY IF EXISTS "Voice notes - Authenticated Insert" ON public.voice_notes;
DROP POLICY IF EXISTS "Voice notes - Authenticated Delete" ON public.voice_notes;

-- 3. Create explicit policies
-- recruiters/members of the company can read notes for candidates they have access to
CREATE POLICY "Voice notes - Authenticated Read" ON public.voice_notes
FOR SELECT TO authenticated
USING (public.can_access_candidate(candidate_id));

-- recruiters/members can insert notes for candidates they have access to
CREATE POLICY "Voice notes - Authenticated Insert" ON public.voice_notes
FOR INSERT TO authenticated
WITH CHECK (public.can_access_candidate(candidate_id));

-- recruiters/members OR the original creator can delete the note
CREATE POLICY "Voice notes - Authenticated Delete" ON public.voice_notes
FOR DELETE TO authenticated
USING (
  public.can_access_candidate(candidate_id)
  OR auth.uid() = user_id
);

-- Grant permissions to authenticated users
GRANT ALL ON public.voice_notes TO authenticated;
