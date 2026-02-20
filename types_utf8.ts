export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
        ]
      }
      candidates: {
        Row: {
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
        }
        Insert: {
          created_at?: string | null
          email: string
          experience_years?: number | null
          id?: string
          linkedin_url?: string | null
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
          },
        ]
      }
      comments: {
        Row: {
          candidate_id: string
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
          created_at: string | null
          id: string
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
          office_locations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          category: string
          client_jd_file_url: string | null
          client_jd_text: string | null
          company_id: string
          created_at: string | null
          generated_jd: string | null
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
          company_id: string
          created_at?: string | null
          generated_jd?: string | null
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
          company_id?: string
          created_at?: string | null
          generated_jd?: string | null
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
          },
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
          },
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
            foreignKeyName: "scorecards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "scorecard_templates"
            referencedColumns: ["id"]
          },
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
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_candidates_by_skill: {
        Args: { skill_query: string }
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
        SetofOptions: {
          from: "*"
          to: "candidates"
          isOneToOne: false
          isSetofReturn: true
        }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
