-- Create company_roles table to store dynamic permissions
CREATE TABLE IF NOT EXISTS public.company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, role_name)
);

-- Enable RLS
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone in the company can view roles
CREATE POLICY "View company roles" ON public.company_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.company_id = company_roles.company_id
            AND team_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = company_roles.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Only admins can manage roles
CREATE POLICY "Manage company roles" ON public.company_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.company_id = company_roles.company_id
            AND team_members.user_id = auth.uid()
            AND team_members.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = company_roles.company_id
            AND companies.user_id = auth.uid()
        )
    );

-- Create a function to backfill default roles for a company
CREATE OR REPLACE FUNCTION public.backfill_company_roles(target_company_id UUID)
RETURNS void AS $$
BEGIN
    -- Admin Role
    INSERT INTO public.company_roles (company_id, role_name, is_system_role, permissions)
    VALUES (target_company_id, 'admin', true, '{
        "canPostJobs": true,
        "canEditJobs": true,
        "canDeleteJobs": true,
        "canManageCandidates": true,
        "canManageInterviews": true,
        "canRecordVoice": true,
        "canManageTeam": true,
        "canEditCompany": true,
        "viewFullDashboard": true
    }'::jsonb)
    ON CONFLICT (company_id, role_name) DO NOTHING;

    -- Recruiter Role
    INSERT INTO public.company_roles (company_id, role_name, is_system_role, permissions)
    VALUES (target_company_id, 'recruiter', true, '{
        "canPostJobs": true,
        "canEditJobs": true,
        "canDeleteJobs": true,
        "canManageCandidates": true,
        "canManageInterviews": true,
        "canRecordVoice": true,
        "canManageTeam": false,
        "canEditCompany": false,
        "viewFullDashboard": true
    }'::jsonb)
    ON CONFLICT (company_id, role_name) DO NOTHING;

    -- Coordinator Role
    INSERT INTO public.company_roles (company_id, role_name, is_system_role, permissions)
    VALUES (target_company_id, 'coordinator', true, '{
        "canPostJobs": false,
        "canEditJobs": false,
        "canDeleteJobs": false,
        "canManageCandidates": false,
        "canManageInterviews": true,
        "canRecordVoice": true,
        "canManageTeam": false,
        "canEditCompany": false,
        "viewFullDashboard": false
    }'::jsonb)
    ON CONFLICT (company_id, role_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill all existing companies
DO $$
DECLARE
    comp_record RECORD;
BEGIN
    FOR comp_record IN SELECT id FROM public.companies LOOP
        PERFORM public.backfill_company_roles(comp_record.id);
    END LOOP;
END;
$$;
