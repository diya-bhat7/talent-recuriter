-- Migration: 22_invite_flow_logic.sql
-- Description: Refine handle_new_user to handle invite/add-member flow

BEGIN;

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
    -- Extract Name
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_mention_tag := public.generate_mention_tag(v_name, NEW.id);

    -- Extract metadata for inviting
    v_target_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
    v_target_role := COALESCE(NEW.raw_user_meta_data->>'target_role', 'coordinator');

    -- 1. Create Profile
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

    -- 2. Create Company if metadata exists (Owner Flow)
    v_company_name := NEW.raw_user_meta_data->>'company_name';
    
    IF v_company_name IS NOT NULL THEN
        -- Check if company name already exists (case-insensitive)
        IF EXISTS (SELECT 1 FROM public.companies WHERE LOWER(company_name) = LOWER(v_company_name)) THEN
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

        -- Add Owner to Team Members as Admin
        IF v_company_id IS NOT NULL THEN
            INSERT INTO public.team_members (company_id, user_id, email, name, role, accepted_at)
            VALUES (v_company_id, NEW.id, NEW.email, v_name, 'admin', now())
            ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'admin', accepted_at = now();
            
            UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
        END IF;
    ELSIF v_target_company_id IS NOT NULL THEN
        -- 3. Add to existing company (Invite/Add Flow)
        INSERT INTO public.team_members (company_id, user_id, email, name, role, accepted_at)
        VALUES (v_target_company_id, NEW.id, NEW.email, v_name, v_target_role, now())
        ON CONFLICT (company_id, user_id) DO UPDATE SET 
            role = EXCLUDED.role,
            accepted_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
