// Activity Log Types

export type ActivityAction =
    | 'created'
    | 'updated'
    | 'deleted'
    | 'status_changed'
    | 'commented'
    | 'scored'
    | 'assigned'
    | 'mentioned';

export type EntityType =
    | 'candidate'
    | 'position'
    | 'comment'
    | 'scorecard'
    | 'company';

export interface ActivityLogEntry {
    id: string;
    company_id: string;
    user_id: string | null;
    user_name: string | null;
    action: ActivityAction;
    entity_type: EntityType;
    entity_id: string;
    entity_name: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

// Comment Types
export interface Comment {
    id: string;
    candidate_id: string;
    user_id: string | null;
    user_name: string;
    content: string;
    mentions: string[];
    is_edited: boolean;
    created_at: string;
    updated_at: string;
}

// Scorecard Types
export interface ScorecardTemplate {
    id: string;
    company_id: string;
    name: string;
    description: string | null;
    criteria: ScorecardCriterion[];
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface ScorecardCriterion {
    name: string;
    description?: string;
    weight: number; // Percentage, should sum to 100
}

export type Recommendation = 'strong_yes' | 'yes' | 'neutral' | 'no' | 'strong_no';

export interface Scorecard {
    id: string;
    candidate_id: string;
    template_id: string | null;
    interviewer_id: string | null;
    interviewer_name: string;
    interview_type: string | null;
    scores: Record<string, number>; // { "Technical Skills": 4 }
    overall_score: number | null;
    notes: string | null;
    recommendation: Recommendation | null;
    created_at: string;
    updated_at: string;
}

// Team Member Types
export type TeamRole = 'admin' | 'recruiter' | 'coordinator';

export interface TeamMember {
    id: string;
    company_id: string;
    user_id: string;
    email: string;
    name: string | null;
    role: TeamRole;
    invited_by: string | null;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
}

// Voice Note Types
export interface VoiceNote {
    id: string;
    candidate_id: string;
    user_id: string | null;
    user_name: string;
    audio_url: string;
    duration_seconds: number | null;
    transcript: string | null;
    created_at: string;
}

// Permission helpers
export const ROLE_PERMISSIONS: Record<TeamRole, {
    canPostJobs: boolean;
    canEditJobs: boolean;
    canDeleteJobs: boolean;
    canManageCandidates: boolean;
    canManageInterviews: boolean;
    canManageTeam: boolean;
    canEditCompany: boolean;
    viewFullDashboard: boolean;
}> = {
    admin: {
        canPostJobs: true,
        canEditJobs: true,
        canDeleteJobs: true,
        canManageCandidates: true,
        canManageInterviews: true,
        canManageTeam: true,
        canEditCompany: true,
        viewFullDashboard: true,
    },
    recruiter: {
        canPostJobs: true,
        canEditJobs: true,
        canDeleteJobs: true,
        canManageCandidates: true,
        canManageInterviews: true,
        canManageTeam: false,
        canEditCompany: false,
        viewFullDashboard: true,
    },
    coordinator: {
        canPostJobs: false,
        canEditJobs: false,
        canDeleteJobs: false,
        canManageCandidates: false,
        canManageInterviews: true,
        canManageTeam: false,
        canEditCompany: false,
        viewFullDashboard: false,
    },
};
