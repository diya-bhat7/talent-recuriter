-- ============================================
-- SUPABASE STORAGE SETUP
-- ============================================
-- This script creates storage buckets and configures
-- Row Level Security (RLS) for files.
-- ============================================

-- ============================================
-- 1. BUCKET CREATION
-- ============================================

-- Create 'company-assets' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-assets', 'company-assets', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Create 'resumes' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Create 'voice-notes' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('voice-notes', 'voice-notes', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- ============================================
-- 2. STORAGE POLICIES (RLS)
-- ============================================

-- company-assets: Public view, authenticated management
DO $$ BEGIN
    -- Select: Anyone can view
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access - company-assets') THEN
        CREATE POLICY "Public Access - company-assets" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
    END IF;

    -- Insert/Update/Delete: Authenticated users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Management - company-assets') THEN
        CREATE POLICY "Authenticated Management - company-assets" ON storage.objects FOR ALL 
        TO authenticated 
        USING (bucket_id = 'company-assets')
        WITH CHECK (bucket_id = 'company-assets');
    END IF;
END $$;

-- resumes: Public view (for link checking), authenticated management
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access - resumes') THEN
        CREATE POLICY "Public Access - resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Management - resumes') THEN
        CREATE POLICY "Authenticated Management - resumes" ON storage.objects FOR ALL 
        TO authenticated 
        USING (bucket_id = 'resumes')
        WITH CHECK (bucket_id = 'resumes');
    END IF;
END $$;

-- voice-notes: Public view, authenticated management
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access - voice-notes') THEN
        CREATE POLICY "Public Access - voice-notes" ON storage.objects FOR SELECT USING (bucket_id = 'voice-notes');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Management - voice-notes') THEN
        CREATE POLICY "Authenticated Management - voice-notes" ON storage.objects FOR ALL 
        TO authenticated 
        USING (bucket_id = 'voice-notes')
        WITH CHECK (bucket_id = 'voice-notes');
    END IF;
END $$;

-- ============================================
-- FINISHED!
-- ============================================
