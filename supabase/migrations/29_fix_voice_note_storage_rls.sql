-- Migration: 29_fix_voice_note_storage_rls.sql
-- Description: Fix RLS policy for voice-notes to handle redundant bucket folder prefixes and prevent invalid UUID cast errors.

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Voice Notes Access" ON storage.objects;

-- Create robust policy
-- This policy handles both:
-- 1. Correct structure: candidate_id/file.webm
-- 2. Redundant structure: voice-notes/candidate_id/file.webm
CREATE POLICY "Voice Notes Access" ON storage.objects 
FOR ALL TO authenticated 
USING (
  bucket_id = 'voice-notes' AND (
    CASE 
      -- Case 1: Redundant 'voice-notes' prefix
      -- Path looks like: voice-notes/uuid/file.webm
      WHEN (storage.foldername(name))[1] = 'voice-notes' 
           AND (storage.foldername(name))[2] IS NOT NULL 
           AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN public.can_access_candidate((storage.foldername(name))[2]::uuid)
      
      -- Case 2: Standard structure
      -- Path looks like: uuid/file.webm
      WHEN (storage.foldername(name))[1] IS NOT NULL 
           AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN public.can_access_candidate((storage.foldername(name))[1]::uuid)
      
      ELSE FALSE
    END
  )
)
WITH CHECK (
  bucket_id = 'voice-notes' AND (
    CASE 
      WHEN (storage.foldername(name))[1] = 'voice-notes' 
           AND (storage.foldername(name))[2] IS NOT NULL 
           AND (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN public.can_access_candidate((storage.foldername(name))[2]::uuid)
      
      WHEN (storage.foldername(name))[1] IS NOT NULL 
           AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN public.can_access_candidate((storage.foldername(name))[1]::uuid)
      
      ELSE FALSE
    END
  )
);
