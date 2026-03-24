-- Migration: 27_final_rls_fix.sql
-- Description: Completely resolve 500 error (recursion) and RLS issues for interviews

BEGIN;

-- 1. Drop all old/problematic policies to start fresh
DROP POLICY IF EXISTS "interviews_select_safe" ON public.interviews;
DROP POLICY IF EXISTS "Interviews select" ON public.interviews;
DROP POLICY IF EXISTS "Interviews view" ON public.interviews;
DROP POLICY IF EXISTS "Interviews insert" ON public.interviews;
DROP POLICY IF EXISTS "Interviews manage" ON public.interviews;
DROP POLICY IF EXISTS "Interviews update" ON public.interviews;
DROP POLICY IF EXISTS "Interviews delete" ON public.interviews;

-- 2. Define a clean non-recursive SELECT policy
-- This checks if the user belongs to the company that owns the position
CREATE POLICY "interviews_select" ON public.interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.positions p
            WHERE p.id = interviews.position_id
            AND (
                p.company_id IN (SELECT public.get_my_owned_company_ids()) 
                OR 
                p.company_id IN (SELECT public.get_my_team_company_ids())
            )
        )
        OR 
        public.is_user_in_interview_panel(id, auth.uid())
    );

-- 3. Define the INSERT policy (Allow all company members)
CREATE POLICY "interviews_insert" ON public.interviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.positions p
            WHERE p.id = position_id
            AND (
                p.company_id IN (SELECT public.get_my_owned_company_ids()) 
                OR 
                p.company_id IN (SELECT public.get_my_team_company_ids())
            )
        )
    );

-- 4. Define UPDATE/DELETE policies
CREATE POLICY "interviews_update" ON public.interviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.positions p
            WHERE p.id = interviews.position_id
            AND (
                p.company_id IN (SELECT public.get_my_owned_company_ids()) 
                OR 
                p.company_id IN (SELECT public.get_my_team_company_ids())
            )
        )
    );

CREATE POLICY "interviews_delete" ON public.interviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.positions p
            WHERE p.id = interviews.position_id
            AND (
                p.company_id IN (SELECT public.get_my_owned_company_ids()) 
                OR 
                p.company_id IN (SELECT public.get_my_team_company_ids())
            )
        )
    );

-- 5. Final Grant permissions to ensure the table is readable
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_panel TO authenticated;

COMMIT;
