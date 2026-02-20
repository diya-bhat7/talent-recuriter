-- ============================================
-- FIX 17: DEEP SCHEMA ALIGNMENT AND SECURITY REFINEMENT
-- ============================================

-- 1. Ensure 'closing_date' exists on positions (Used in JobBoard.tsx and PositionCard.tsx)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'closing_date') THEN
        ALTER TABLE public.positions ADD COLUMN closing_date DATE;
    END IF;
END $$;

-- 2. Refine 'is_member_of_company' to include the owner
-- This prevents owners from being locked out if they aren't explicitly in team_members
CREATE OR REPLACE FUNCTION public.is_member_of_company(cid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = cid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.team_members
    WHERE company_id = cid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Standardize Interview single-column references (Optional but good for alignment)
-- Frontend mostly uses panel table, but we ensure base table columns are consistent
-- Ensure interviewer_id is nullable (it should be for group interviews)
ALTER TABLE public.interviews ALTER COLUMN interviewer_id DROP NOT NULL;

-- 4. Final Security check for interviews (Non-recursive)
CREATE OR REPLACE FUNCTION public.is_interview_accessible(iid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_can_view_interview(iid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Standardize Profile References in Team Members
-- Some older logic might point to auth.users, we prefer public.profiles
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'team_members_user_id_fkey') THEN
        ALTER TABLE public.team_members DROP CONSTRAINT team_members_user_id_fkey;
        ALTER TABLE public.team_members ADD CONSTRAINT team_members_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Add missing Notifications Policy
DROP POLICY IF EXISTS "Notifications access" ON public.notifications;
CREATE POLICY "Notifications access" ON public.notifications FOR ALL USING (auth.uid() = user_id);
-- 7. Refine Candidates and Positions access
DROP POLICY IF EXISTS "Positions access" ON public.positions;
CREATE POLICY "Positions access" ON public.positions FOR ALL USING (public.is_member_of_company(company_id));

DROP POLICY IF EXISTS "Candidates access" ON public.candidates;
CREATE POLICY "Candidates access" ON public.candidates FOR ALL USING (public.can_access_candidate(id));

-- 8. Final Refine for Companies and Team Members
DROP POLICY IF EXISTS "Companies access" ON public.companies;
CREATE POLICY "Companies access" ON public.companies FOR SELECT USING (public.is_member_of_company(id));
CREATE POLICY "Companies manage" ON public.companies FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team membership access" ON public.team_members;
CREATE POLICY "Team membership access" ON public.team_members FOR SELECT USING (public.is_member_of_company(company_id));
