-- ============================================
-- 27. STORAGE HARDENING (LOVABLE AUDIT)
-- ============================================
-- This migration fixes overly permissive storage policies.

-- 1. Remove Public Access Policies
DROP POLICY IF EXISTS "Public Access - company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - voice-notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Management - company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Management - resumes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Management - voice-notes" ON storage.objects;

-- 2. Secure 'company-assets'
-- Only company members can view/manage assets
CREATE POLICY "Company Assets Access" ON storage.objects 
FOR ALL TO authenticated 
USING (
  bucket_id = 'company-assets' AND (
    (storage.foldername(name))[2] IS NOT NULL AND 
    public.is_member_of_company((storage.foldername(name))[2]::uuid)
  )
)
WITH CHECK (
  bucket_id = 'company-assets' AND (
    (storage.foldername(name))[2] IS NOT NULL AND 
    public.is_member_of_company((storage.foldername(name))[2]::uuid)
  )
);

-- 3. Secure 'resumes'
-- Anyone can upload (anon/public for job seekers), but only authorized company members can view/delete
CREATE POLICY "Candidate Resume Upload" ON storage.objects 
FOR INSERT TO anon, authenticated 
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Candidate Resume Access" ON storage.objects 
FOR SELECT TO authenticated 
USING (
  bucket_id = 'resumes' AND 
  EXISTS (
    SELECT 1 FROM public.positions p
    WHERE p.id = (storage.foldername(name))[1]::uuid
    AND public.is_member_of_company(p.company_id)
  )
);

-- 4. Secure 'voice-notes'
-- Only users who can access the candidate can view/manage voice notes
CREATE POLICY "Voice Notes Access" ON storage.objects 
FOR ALL TO authenticated 
USING (
  bucket_id = 'voice-notes' AND 
  public.can_access_candidate((storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'voice-notes' AND 
  public.can_access_candidate((storage.foldername(name))[1]::uuid)
);

-- Ensure profiles avatar_url remains public for display
CREATE POLICY "Public Avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars'); -- Assuming a dedicated bucket for public avatars if exists, otherwise scoped.
