-- Migration: 23_permanent_profile_sync.sql
-- Description: Consolidate user sync, attach trigger, and backfill missing profiles.

BEGIN;

-- 1. Ensure Profiles table has correct structure (just in case)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'coordinator';

-- 2. Consolidate the User Sync Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_mention_tag TEXT;
    v_company_name TEXT;
    v_company_id UUID;
    v_target_company_id UUID;
    v_target_role TEXT;
BEGIN
    -- Extract Name basic logic
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_mention_tag := public.generate_mention_tag(v_name, NEW.id);

    -- Extract metadata for inviting flow (managed onboarding)
    v_target_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
    v_target_role := COALESCE(NEW.raw_user_meta_data->>'target_role', 'coordinator');

    -- Profile Creation/Update
    INSERT INTO public.profiles (id, name, email, mention_tag, avatar_url, role)
    VALUES (
        NEW.id, 
        v_name, 
        NEW.email, 
        v_mention_tag, 
        NEW.raw_user_meta_data->>'avatar_url',
        v_target_role
    )
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = now();

    -- Company Owner Flow
    v_company_name := NEW.raw_user_meta_data->>'company_name';
    IF v_company_name IS NOT NULL THEN
        -- Check duplicate company name (safety net)
        IF NOT EXISTS (SELECT 1 FROM public.companies WHERE LOWER(company_name) = LOWER(v_company_name)) THEN
            INSERT INTO public.companies (user_id, company_name, contact_name, contact_email)
            VALUES (NEW.id, v_company_name, v_name, NEW.email)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING id INTO v_company_id;

            IF v_company_id IS NOT NULL THEN
                INSERT INTO public.team_members (company_id, user_id, email, name, role, accepted_at)
                VALUES (v_company_id, NEW.id, NEW.email, v_name, 'admin', now())
                ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'admin';
                
                UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
            END IF;
        END IF;
    ELSIF v_target_company_id IS NOT NULL THEN
        -- Managed Teammate Flow (Invite)
        INSERT INTO public.team_members (company_id, user_id, email, name, role, accepted_at)
        VALUES (v_target_company_id, NEW.id, NEW.email, v_name, v_target_role, now())
        ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE TRIGGER IS ATTACHED
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. BACKFILL SCRIPT: Create profiles for any existing users missed
INSERT INTO public.profiles (id, name, email, role)
SELECT 
    u.id, 
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    u.email,
    COALESCE(u.raw_user_meta_data->>'target_role', 'coordinator')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 5. UPGRADE OWNERS TO ADMINS (if missed)
UPDATE public.profiles p
SET role = 'admin'
FROM public.companies c
WHERE p.id = c.user_id AND p.role != 'admin';

COMMIT;
