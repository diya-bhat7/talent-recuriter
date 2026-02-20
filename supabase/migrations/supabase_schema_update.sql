-- Add missing columns to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS mentions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Enable RLS (if not already enabled)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view comments for candidates in their company
-- Note: This assumes candidates have a company_id or are linked to one.
-- For now, let's keep it simple: users can see comments where they are the author OR if they belong to the company the candidate belongs to.
-- But since we don't have company_id on candidates easily accessible in RLS without a join, we will rely on company_id on the comment itself.

-- UPDATE EXISTING POLICIES (Drop and recreates to be safe)
DROP POLICY IF EXISTS "Users can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- 1. VIEW: Users can view comments if they are authenticated (for now, to unblock)
CREATE POLICY "Users can view comments"
ON public.comments FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. INSERT: Users can insert comments if they are authenticated and set their own user_id
CREATE POLICY "Users can insert comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

-- 4. DELETE: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);
