-- 1. Add missing logo_url column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Re-grant permissions (to be safe)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
