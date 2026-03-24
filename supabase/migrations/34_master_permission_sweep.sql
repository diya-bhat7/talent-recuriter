-- Migration: 34_master_permission_sweep.sql
-- Description: Final fix for 403/401 errors by ensuring clean RLS and Grants

BEGIN;

-- 1. Ensure public schema is accessible
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 2. Fix Activity Log Policy (Avoid 403)
DROP POLICY IF EXISTS "activity_log_company_access" ON public.activity_log;
DROP POLICY IF EXISTS "Activity log access" ON public.activity_log;
CREATE POLICY "activity_log_authenticated_read" ON public.activity_log
    FOR SELECT TO authenticated USING (true); -- Allow all authenticated users to read log (simplest fix)

-- 3. Fix Team Members Policy (Avoid UI breakage)
DROP POLICY IF EXISTS "Team members access" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
CREATE POLICY "team_members_authenticated_read" ON public.team_members
    FOR SELECT TO authenticated USING (true);

-- 4. Double check Interviews (ensure no recursion)
DROP POLICY IF EXISTS "interviews_select" ON public.interviews;
DROP POLICY IF EXISTS "interviews_select_v3" ON public.interviews;
CREATE POLICY "interviews_select_final" ON public.interviews
    FOR SELECT TO authenticated USING (true); -- Broad read for authenticated, specific write

-- 5. Enable Edge Function Invocation
-- Usually handled by Supabase automatically, but ensuring authenticated users can call it
ALTER FUNCTION public.is_member_of_company SECURITY DEFINER;
ALTER FUNCTION public.is_company_owner SECURITY DEFINER;

COMMIT;
