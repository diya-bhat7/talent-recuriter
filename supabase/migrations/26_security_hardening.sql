-- ============================================
-- 26. SECURITY HARDENING (LOVABLE AUDIT)
-- ============================================
-- This migration tightens RLS policies to prevent
-- public exposure and cross-company data leakage.

-- 1. Tighten Profiles
-- Ensure members can only see profiles of people in their own company
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Profiles access" ON profiles 
FOR SELECT TO authenticated 
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM team_members t1 
    JOIN team_members t2 ON t1.company_id = t2.company_id 
    WHERE t1.user_id = auth.uid() AND t2.user_id = profiles.id
  )
);

-- 2. Tighten Submissions
-- Lock down submissions to service_role by default
DROP POLICY IF EXISTS "Submissions view" ON submissions;
CREATE POLICY "Admin submissions view" ON submissions 
FOR SELECT TO authenticated 
USING (auth.role() = 'service_role');

-- 3. Explicitly Restrict Candidates & Companies to Authenticated
-- Ensure no anonymous access is possible even if RLS is somehow bypassed
DROP POLICY IF EXISTS "Candidates access" ON candidates;
CREATE POLICY "Candidates access" ON candidates 
FOR ALL TO authenticated 
USING (public.can_access_candidate(id))
WITH CHECK (public.can_access_candidate(id));

DROP POLICY IF EXISTS "Companies access" ON companies;
CREATE POLICY "Companies access" ON companies 
FOR SELECT TO authenticated 
USING (public.is_member_of_company(id));

-- 4. Cleanup any potential anon grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT INSERT ON public.submissions TO anon; -- Keep public form submission
GRANT SELECT ON public.companies TO authenticated; -- Required for dashboard context
