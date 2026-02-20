-- 1. Add missing rating columns
ALTER TABLE public.scorecards ADD COLUMN IF NOT EXISTS tech_rating INTEGER;
ALTER TABLE public.scorecards ADD COLUMN IF NOT EXISTS comm_rating INTEGER;
ALTER TABLE public.scorecards ADD COLUMN IF NOT EXISTS culture_rating INTEGER;

-- 2. Rename columns to match frontend service (if they exist with old names)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scorecards' AND column_name = 'interviewer_id') THEN
        ALTER TABLE public.scorecards RENAME COLUMN interviewer_id TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scorecards' AND column_name = 'interviewer_name') THEN
        ALTER TABLE public.scorecards RENAME COLUMN interviewer_name TO user_name;
    END IF;
END $$;

-- 3. Add RLS Policies
DROP POLICY IF EXISTS "Scorecards access" ON public.scorecards;
CREATE POLICY "Scorecards access" ON public.scorecards
    FOR ALL USING (
        public.can_access_candidate(candidate_id)
    );

-- 4. Re-grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scorecards TO authenticated;
