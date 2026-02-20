-- Migration: 21_strict_company_registration.sql
-- Description: Enforce unique company names and refine initial admin assignment

BEGIN;

-- 1. Add unique constraint on company_name (case-insensitive)
-- First, handle any potential duplicates (though unlikely in current state)
-- If duplicates existed, this would fail, alerting the dev to clean up.
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_unique_lower ON public.companies (LOWER(company_name));

-- 2. Refine handle_new_user to handle registration conflicts gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_mention_tag TEXT;
    v_company_name TEXT;
    v_company_id UUID;
BEGIN
    -- Extract Name
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_mention_tag := public.generate_mention_tag(v_name, NEW.id);

    -- 1. Create Profile
    INSERT INTO public.profiles (id, name, email, mention_tag, avatar_url, role)
    VALUES (
        NEW.id, 
        v_name, 
        NEW.email, 
        v_mention_tag, 
        NEW.raw_user_meta_data->>'avatar_url',
        'coordinator' -- Default role, will be upgraded if they create a company
    )
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        email = EXCLUDED.email, 
        updated_at = now();

    -- 2. Create Company if metadata exists (Owner Flow)
    v_company_name := NEW.raw_user_meta_data->>'company_name';
    
    IF v_company_name IS NOT NULL THEN
        -- Check if company name already exists (case-insensitive)
        IF EXISTS (SELECT 1 FROM public.companies WHERE LOWER(company_name) = LOWER(v_company_name)) THEN
            -- If it exists, we skip company creation. 
            -- The frontend should ideally catch this, but this is the safety net.
            -- We don't raise an exception here because it would break auth signup.
            -- Instead, we let the user sign up but they won't have a company associated.
            RETURN NEW;
        END IF;

        INSERT INTO public.companies (
            user_id, 
            company_name, 
            company_website, 
            company_linkedin, 
            office_locations, 
            contact_email, 
            contact_title, 
            contact_name
        ) VALUES (
            NEW.id,
            v_company_name,
            NEW.raw_user_meta_data->>'company_website',
            NEW.raw_user_meta_data->>'company_linkedin',
            (SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'office_locations'))),
            COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email),
            NEW.raw_user_meta_data->>'contact_title',
            NEW.raw_user_meta_data->>'contact_name'
        )
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id INTO v_company_id;

        -- 3. Add Owner to Team Members as Admin and update Profile Role
        IF v_company_id IS NOT NULL THEN
            INSERT INTO public.team_members (company_id, user_id, email, name, role)
            VALUES (v_company_id, NEW.id, NEW.email, v_name, 'admin')
            ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'admin';
            
            UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
