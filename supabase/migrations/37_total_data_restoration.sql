-- Migration: 37_total_data_restoration.sql
-- Description: Disables RLS for all core recruitment tables to restore data visibility.

BEGIN;

-- 1. Disable RLS for Core Recruitment Tables
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecards DISABLE ROW LEVEL SECURITY;

-- 2. Grant Global Access to Authenticated Users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 3. Safety Check: If policies were enabled, replace them with simple ones
-- (Usually unnecessary if RLS is disabled, but good for completeness)
DROP POLICY IF EXISTS "candidates_select_v2" ON public.candidates;
CREATE POLICY "nuclear_candidates_all" ON public.candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "positions_select_v2" ON public.positions;
CREATE POLICY "nuclear_positions_all" ON public.positions FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
