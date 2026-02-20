-- Migration: 19_add_role_to_profiles.sql
-- Description: Add role column to profiles and sync from team_members/companies

BEGIN;

-- 1. Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'coordinator';

-- 2. Populate existing roles in profiles
-- Set owners as admins
UPDATE public.profiles p
SET role = 'admin'
FROM public.companies c
WHERE p.id = c.user_id;

-- Set team members based on their role in team_members
UPDATE public.profiles p
SET role = tm.role
FROM public.team_members tm
WHERE p.id = tm.user_id;

-- 3. Create/Update sync functions

-- Function to sync role to profile when team_members changes
CREATE OR REPLACE FUNCTION public.sync_role_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET role = NEW.role
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to ensure company owner is always admin in profile
CREATE OR REPLACE FUNCTION public.sync_owner_role_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create Triggers

DROP TRIGGER IF EXISTS trigger_sync_role_to_profile ON public.team_members;
CREATE TRIGGER trigger_sync_role_to_profile
AFTER INSERT OR UPDATE OF role ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_role_to_profile();

DROP TRIGGER IF EXISTS trigger_sync_owner_role_to_profile ON public.companies;
CREATE TRIGGER trigger_sync_owner_role_to_profile
AFTER INSERT OR UPDATE OF user_id ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_role_to_profile();

COMMIT;
