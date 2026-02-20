export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            activity_log: {
                Row: {
                    action: string
                    company_id: string
                    created_at: string | null
                    entity_id: string
                    entity_name: string | null
                    entity_type: string
                    id: string
                    metadata: Json | null
                    user_id: string | null
                    user_name: string | null
                }
                Insert: {
                    action: string
                    company_id: string
                    created_at?: string | null
                    entity_id: string
                    entity_name?: string | null
                    entity_type: string
                    id?: string
                    metadata?: Json | null
                    user_id?: string | null
                    user_name?: string | null
                }
                Update: {
                    action?: string
                    company_id?: string
                    created_at?: string | null
                    entity_id?: string
                    entity_name?: string | null
                    entity_type?: string
                    id?: string
                    metadata?: Json | null
                    user_id?: string | null
                    user_name?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_log_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_log_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            candidates: {
                Row: {
                    created_at: string | null
                    email: string
                    experience_years: number | null
                    id: string
                    linkedin_url: string | null
                    mention_tag: string | null
                    name: string
                    notes: string | null
                    phone: string | null
                    position_id: string
                    rating: number | null
                    resume_url: string | null
                    skills: string[] | null
                    status: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    experience_years?: number | null
                    id?: string
                    linkedin_url?: string | null
                    mention_tag?: string | null
                    name: string
                    notes?: string | null
                    phone?: string | null
                    position_id: string
                    rating?: number | null
                    resume_url?: string | null
                    skills?: string[] | null
                    status?: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string
                    experience_years?: number | null
                    id?: string
                    linkedin_url?: string | null
                    mention_tag?: string | null
                    name?: string
                    notes?: string | null
                    phone?: string | null
                    position_id?: string
                    rating?: number | null
                    resume_url?: string | null
                    skills?: string[] | null
                    status?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "candidates_position_id_fkey"
                        columns: ["position_id"]
                        isOneToOne: false
                        referencedRelation: "positions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            interviews: {
                Row: {
                    candidate_id: string
                    created_at: string | null
                    duration_minutes: number
                    id: string
                    interview_type: string | null
                    interviewer_id: string
                    meeting_link: string | null
                    notes: string | null
                    position_id: string
                    scheduled_at: string
                    status: string
                    updated_at: string | null
                }
                Insert: {
                    candidate_id: string
                    created_at?: string | null
                    duration_minutes?: number
                    id?: string
                    interview_type?: string | null
                    interviewer_id: string
                    meeting_link?: string | null
                    notes?: string | null
                    position_id: string
                    scheduled_at: string
                    status?: string
                    updated_at?: string | null
                }
                Update: {
                    candidate_id?: string
                    created_at?: string | null
                    duration_minutes?: number
                    id?: string
                    interview_type?: string | null
                    interviewer_id?: string
                    meeting_link?: string | null
                    notes?: string | null
                    position_id?: string
                    scheduled_at?: string
                    status?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "interviews_candidate_id_fkey"
                        columns: ["candidate_id"]
                        isOneToOne: false
                        referencedRelation: "candidates"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "interviews_position_id_fkey"
                        columns: ["position_id"]
                        isOneToOne: false
                        referencedRelation: "positions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            interview_guides: {
                Row: {
                    company_id: string
                    created_at: string | null
                    description: string | null
                    id: string
                    position_id: string | null
                    questions: Json
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    company_id: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    position_id?: string | null
                    questions?: Json
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    company_id?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    position_id?: string | null
                    questions?: Json
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "interview_guides_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "interview_guides_position_id_fkey"
                        columns: ["position_id"]
                        isOneToOne: false
                        referencedRelation: "positions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            companies: {
                Row: {
                    company_linkedin: string | null
                    company_name: string
                    company_website: string | null
                    contact_email: string
                    contact_name: string
                    contact_title: string | null
                    id: string
                    mention_tag: string | null
                    logo_url: string | null
                    office_locations: string[] | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    company_linkedin?: string | null
                    company_name: string
                    company_website?: string | null
                    contact_email: string
                    contact_name: string
                    contact_title?: string | null
                    created_at?: string | null
                    id?: string
                    mention_tag?: string | null
                    logo_url?: string | null
                    office_locations?: string[] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    company_linkedin?: string | null
                    company_name?: string
                    company_website?: string | null
                    contact_email?: string
                    contact_name?: string
                    contact_title?: string | null
                    created_at?: string | null
                    id?: string
                    mention_tag?: string | null
                    logo_url?: string | null
                    office_locations?: string[] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "companies_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            comments: {
                Row: {
                    candidate_id: string
                    company_id: string | null
                    content: string
                    created_at: string | null
                    id: string
                    is_edited: boolean | null
                    mentions: string[] | null
                    updated_at: string | null
                    user_id: string | null
                    user_name: string
                }
                Insert: {
                    candidate_id: string
                    company_id?: string | null
                    content: string
                    created_at?: string | null
                    id?: string
                    is_edited?: boolean | null
                    mentions?: string[] | null
                    updated_at?: string | null
                    user_id?: string | null
                    user_name: string
                }
                Update: {
                    candidate_id?: string
                    company_id?: string | null
                    content?: string
                    created_at?: string | null
                    id?: string
                    is_edited?: boolean | null
                    mentions?: string[] | null
                    updated_at?: string | null
                    user_id?: string | null
                    user_name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "comments_candidate_id_fkey"
                        columns: ["candidate_id"]
                        isOneToOne: false
                        referencedRelation: "candidates"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "comments_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "comments_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            positions: {
                Row: {
                    category: string
                    client_jd_file_url: string | null
                    client_jd_text: string | null
                    closing_date: string | null
                    company_id: string
                    created_at: string | null
                    generated_jd: string | null
                    hired_count: number
                    hiring_start_date: string | null
                    id: string
                    in_office_days: number | null
                    interview_prep_doc: string | null
                    key_requirements: string | null
                    max_experience: number
                    min_experience: number
                    num_roles: number
                    position_name: string
                    preferred_locations: string[] | null
                    priority: string
                    status: string | null
                    updated_at: string | null
                    work_type: string
                }
                Insert: {
                    category: string
                    client_jd_file_url?: string | null
                    client_jd_text?: string | null
                    closing_date?: string | null
                    company_id: string
                    created_at?: string | null
                    generated_jd?: string | null
                    hired_count?: number
                    hiring_start_date?: string | null
                    id?: string
                    in_office_days?: number | null
                    interview_prep_doc?: string | null
                    key_requirements?: string | null
                    max_experience?: number
                    min_experience?: number
                    num_roles?: number
                    position_name: string
                    preferred_locations?: string[] | null
                    priority?: string
                    status?: string | null
                    updated_at?: string | null
                    work_type?: string
                }
                Update: {
                    category?: string
                    client_jd_file_url?: string | null
                    client_jd_text?: string | null
                    closing_date?: string | null
                    company_id?: string
                    created_at?: string | null
                    generated_jd?: string | null
                    hired_count?: number
                    hiring_start_date?: string | null
                    id?: string
                    in_office_days?: number | null
                    interview_prep_doc?: string | null
                    key_requirements?: string | null
                    max_experience?: number
                    min_experience?: number
                    num_roles?: number
                    position_name?: string
                    preferred_locations?: string[] | null
                    priority?: string
                    status?: string | null
                    updated_at?: string | null
                    work_type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "positions_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            scorecard_templates: {
                Row: {
                    company_id: string
                    created_at: string | null
                    criteria: Json
                    description: string | null
                    id: string
                    is_default: boolean | null
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    company_id: string
                    created_at?: string | null
                    criteria?: Json
                    description?: string | null
                    id?: string
                    is_default?: boolean | null
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    company_id?: string
                    created_at?: string | null
                    criteria?: Json
                    description?: string | null
                    id?: string
                    is_default?: boolean | null
                    name?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "scorecard_templates_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            scorecards: {
                Row: {
                    candidate_id: string
                    created_at: string | null
                    id: string
                    interview_type: string | null
                    interviewer_id: string | null
                    interviewer_name: string
                    notes: string | null
                    overall_score: number | null
                    recommendation: string | null
                    scores: Json
                    template_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    candidate_id: string
                    created_at?: string | null
                    id?: string
                    interview_type?: string | null
                    interviewer_id?: string | null
                    interviewer_name: string
                    notes?: string | null
                    overall_score?: number | null
                    recommendation?: string | null
                    scores?: Json
                    template_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    candidate_id?: string
                    created_at?: string | null
                    id?: string
                    interview_type?: string | null
                    interviewer_id?: string | null
                    interviewer_name?: string
                    notes?: string | null
                    overall_score?: number | null
                    recommendation?: string | null
                    scores?: Json
                    template_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "scorecards_candidate_id_fkey"
                        columns: ["candidate_id"]
                        isOneToOne: false
                        referencedRelation: "candidates"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "scorecards_interviewer_id_fkey"
                        columns: ["interviewer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "scorecards_template_id_fkey"
                        columns: ["template_id"]
                        isOneToOne: false
                        referencedRelation: "scorecard_templates"
                        referencedColumns: ["id"]
                    }
                ]
            }
            submissions: {
                Row: {
                    airtable_id: string | null
                    created_at: string
                    email: string
                    id: string
                    last_synced_at: string | null
                    name: string
                    source: string | null
                    sync_status: string | null
                    sync_to_airtable: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    airtable_id?: string | null
                    created_at?: string
                    email: string
                    id?: string
                    last_synced_at?: string | null
                    name: string
                    source?: string | null
                    sync_status?: string | null
                    sync_to_airtable?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    airtable_id?: string | null
                    created_at?: string
                    email?: string
                    id?: string
                    last_synced_at?: string | null
                    name?: string
                    source?: string | null
                    sync_status?: string | null
                    sync_to_airtable?: boolean | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            team_members: {
                Row: {
                    accepted_at: string | null
                    company_id: string
                    created_at: string | null
                    email: string
                    id: string
                    invited_by: string | null
                    mention_tag: string | null
                    name: string | null
                    role: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    accepted_at?: string | null
                    company_id: string
                    created_at?: string | null
                    email: string
                    id?: string
                    invited_by?: string | null
                    mention_tag?: string | null
                    name?: string | null
                    role?: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    accepted_at?: string | null
                    company_id?: string
                    created_at?: string | null
                    email?: string
                    id?: string
                    invited_by?: string | null
                    mention_tag?: string | null
                    name?: string | null
                    role?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_members_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    mention_tag: string | null
                    name: string | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    id: string
                    mention_tag?: string | null
                    name?: string | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    mention_tag?: string | null
                    name?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            voice_notes: {
                Row: {
                    audio_url: string
                    candidate_id: string
                    created_at: string | null
                    duration_seconds: number | null
                    id: string
                    transcript: string | null
                    user_id: string | null
                    user_name: string
                }
                Insert: {
                    audio_url: string
                    candidate_id: string
                    created_at?: string | null
                    duration_seconds?: number | null
                    id?: string
                    transcript?: string | null
                    user_id?: string | null
                    user_name: string
                }
                Update: {
                    audio_url?: string
                    candidate_id?: string
                    created_at?: string | null
                    duration_seconds?: number | null
                    id?: string
                    transcript?: string | null
                    user_id?: string | null
                    user_name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "voice_notes_candidate_id_fkey"
                        columns: ["candidate_id"]
                        isOneToOne: false
                        referencedRelation: "candidates"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    company_id: string
                    type: string
                    title: string
                    message: string
                    link: string | null
                    is_read: boolean | null
                    created_at: string | null
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    company_id: string
                    type: string
                    title: string
                    message: string
                    link?: string | null
                    is_read?: boolean | null
                    created_at?: string | null
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    company_id?: string
                    type?: string
                    title?: string
                    message?: string
                    link?: string | null
                    is_read?: boolean | null
                    created_at?: string | null
                    metadata?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            search_candidates_by_skill: {
                Args: {
                    skill_query: string
                }
                Returns: {
                    created_at: string | null
                    email: string
                    experience_years: number | null
                    id: string
                    linkedin_url: string | null
                    name: string
                    notes: string | null
                    phone: string | null
                    position_id: string
                    rating: number | null
                    resume_url: string | null
                    skills: string[] | null
                    status: string
                    updated_at: string | null
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
