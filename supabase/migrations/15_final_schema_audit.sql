-- ============================================
-- 15. FINAL SCHEMA AUDIT & RLS INTEGRITY
-- ============================================

-- 1. Standardize User References to public.profiles
-- This ensures name/avatar joins work correctly and avoids auth schema complexity
ALTER TABLE public.voice_notes DROP CONSTRAINT IF EXISTS voice_notes_user_id_fkey;
ALTER TABLE public.voice_notes ADD CONSTRAINT voice_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.scorecards DROP CONSTRAINT IF EXISTS scorecards_interviewer_id_fkey;
ALTER TABLE public.scorecards DROP CONSTRAINT IF EXISTS scorecards_user_id_fkey;
ALTER TABLE public.scorecards ADD CONSTRAINT scorecards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Non-Recursive RLS for remaining tables
-- Using SECURITY DEFINER helpers for speed and stability

-- Comments
DROP POLICY IF EXISTS "Comments access" ON public.comments;
CREATE POLICY "comments_access_safe" ON public.comments
    FOR ALL USING (public.is_member_of_company(company_id));

-- Notifications
DROP POLICY IF EXISTS "Notifications access" ON public.notifications;
CREATE POLICY "notifications_owner_access" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- Activity Log
DROP POLICY IF EXISTS "Activity log access" ON public.activity_log;
CREATE POLICY "activity_log_company_access" ON public.activity_log
    FOR SELECT USING (public.is_member_of_company(company_id));

-- Interview Guides
DROP POLICY IF EXISTS "Interview guides access" ON public.interview_guides;
CREATE POLICY "interview_guides_company_access" ON public.interview_guides
    FOR ALL USING (public.is_member_of_company(company_id));

-- Scorecard Templates
DROP POLICY IF EXISTS "Scorecard templates access" ON public.scorecard_templates;
CREATE POLICY "scorecard_templates_company_access" ON public.scorecard_templates
    FOR ALL USING (public.is_member_of_company(company_id));

-- Scorecards (using helper for candidate access)
DROP POLICY IF EXISTS "Scorecards access" ON public.scorecards;
CREATE POLICY "scorecards_candidate_access" ON public.scorecards
    FOR ALL USING (public.can_access_candidate(candidate_id));

-- 3. Ensure Table Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
