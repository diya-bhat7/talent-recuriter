-- 1. Add missing column to interviews
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false;
