-- Migration: 30_storage_security_refinement.sql
-- Description: Refine storage RLS policies to be robust against redundant paths and invalid UUID casts.
-- This replaces foldername index access with safe regex extraction.

-- 1. Voice Notes
DROP POLICY IF EXISTS "Voice Notes Access" ON storage.objects;

CREATE POLICY "Voice Notes Access" ON storage.objects 
FOR ALL TO authenticated 
USING (
  bucket_id = 'voice-notes' AND (
    -- Extract the first valid UUID found in the path string
    (substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')) IS NOT NULL 
    AND
    public.can_access_candidate((substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'))::uuid)
  )
)
WITH CHECK (
  bucket_id = 'voice-notes' AND (
    (substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')) IS NOT NULL 
    AND
    public.can_access_candidate((substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'))::uuid)
  )
);

-- 2. Resumes
-- Path can be: position_id/candidate_id/file.pdf OR candidate_id/file.pdf
DROP POLICY IF EXISTS "Candidate Resume Access" ON storage.objects;

CREATE POLICY "Candidate Resume Access" ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'resumes' AND (
    (substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')) IS NOT NULL 
    AND (
      -- Check if the first UUID is a position we have access to
      EXISTS (
        SELECT 1 FROM public.positions p
        WHERE p.id = (substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'))::uuid
        AND public.is_member_of_company(p.company_id)
      )
      OR
      -- OR check if it's a candidate we have access to
      public.can_access_candidate((substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'))::uuid)
    )
  )
);

-- 3. Company Assets
DROP POLICY IF EXISTS "Company Assets Access" ON storage.objects;

CREATE POLICY "Company Assets Access" ON storage.objects 
FOR ALL TO authenticated 
USING (
  bucket_id = 'company-assets' AND (
    (substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')) IS NOT NULL 
    AND
    public.is_member_of_company((substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'))::uuid)
  )
);
