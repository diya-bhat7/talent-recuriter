-- Simplified Notification RLS Policy
-- Allows authenticated users to create notifications for anyone in their own company

DROP POLICY IF EXISTS "Notifications access" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for team" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- 1. Users can view their own notifications
CREATE POLICY "notifications_select_own" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can create notifications for members of their same company
-- We use a simpler join to avoid complex nested EXISTS
CREATE POLICY "notifications_insert_team" 
ON public.notifications FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.company_id = notifications.company_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.companies
        WHERE companies.id = notifications.company_id
        AND companies.user_id = auth.uid()
    )
);

-- 3. Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Users can delete their own notifications
CREATE POLICY "notifications_delete_own" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);
