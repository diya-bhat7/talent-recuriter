-- 1. Add missing column to interviews
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS interview_type TEXT;
