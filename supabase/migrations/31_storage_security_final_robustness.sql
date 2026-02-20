-- Migration: 31_storage_security_final_robustness.sql
-- Description: FINAL robustness fix for storage RLS.
-- This policy checks multiple folder depths to find a valid UUID and verify access.

-- 1. Voice Notes
DROP POLICY IF EXISTS "Voice Notes Access" ON storage.objects;

CREATE POLICY "Voice Notes Access" ON storage.objects 
FOR ALL TO authenticated 
USING (
  bucket_id = 'voice-notes' AND (
    CASE 
      -- Index 1 is candidate UUID
      WHEN (storage.foldername(name))[1] IS NOT NULL 
           AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND public.can_access_candidate((storage.foldername(name))[1]::uuid)
      THEN TRUE
      
      -- Index 2 is candidate UUID (handles 'voice-notes/uuid/file')
      WHEN (storage.foldername(name))[2] IS NOT NULL 
           AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND public.can_access_candidate((storage.foldername(name))[2]::uuid)
      THEN TRUE

      -- Substring fallback if somehow embedded deeper or weird naming
      WHEN (substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')) IS NOT NULL 
           AND public.can_access_candidate((substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'))::uuid)
      THEN TRUE
      
      ELSE FALSE
    END
  )
)
WITH CHECK (
  bucket_id = 'voice-notes' AND (
    CASE 
      WHEN (storage.foldername(name))[1] IS NOT NULL 
           AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND public.can_access_candidate((storage.foldername(name))[1]::uuid)
      THEN TRUE
      
      WHEN (storage.foldername(name))[2] IS NOT NULL 
           AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           AND public.can_access_candidate((storage.foldername(name))[2]::uuid)
      THEN TRUE

      WHEN (substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')) IS NOT NULL 
           AND public.can_access_candidate((substring(name from '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'))::uuid)
      THEN TRUE
      
      ELSE FALSE
    END
  )
);

-- Ensure profiles avatar_url remains public
DROP POLICY IF EXISTS "Public Avatars" ON storage.objects;
CREATE POLICY "Public Avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
