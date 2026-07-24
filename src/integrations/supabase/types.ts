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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_status_history: {
        Row: {
          application_id: string
          created_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["app_status"]
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["app_status"]
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["app_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          agreed_terms: boolean
          amount: number
          answers: Json | null
          application_number: string
          attended: boolean
          branch: string | null
          college: string | null
          created_at: string
          email: string
          event_id: string
          experience_level: string | null
          full_name: string
          gender: string | null
          github_url: string | null
          id: string
          languages: string[] | null
          linkedin_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string | null
          portfolio_url: string | null
          resume_url: string | null
          roll_number: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["app_status"]
          team_members: Json | null
          team_name: string | null
          team_size: number | null
          university: string | null
          updated_at: string
          user_id: string
          xp_earned: number
          year: string | null
        }
        Insert: {
          agreed_terms?: boolean
          amount?: number
          answers?: Json | null
          application_number?: string
          attended?: boolean
          branch?: string | null
          college?: string | null
          created_at?: string
          email: string
          event_id: string
          experience_level?: string | null
          full_name: string
          gender?: string | null
          github_url?: string | null
          id?: string
          languages?: string[] | null
          linkedin_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          roll_number?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["app_status"]
          team_members?: Json | null
          team_name?: string | null
          team_size?: number | null
          university?: string | null
          updated_at?: string
          user_id: string
          xp_earned?: number
          year?: string | null
        }
        Update: {
          agreed_terms?: boolean
          amount?: number
          answers?: Json | null
          application_number?: string
          attended?: boolean
          branch?: string | null
          college?: string | null
          created_at?: string
          email?: string
          event_id?: string
          experience_level?: string | null
          full_name?: string
          gender?: string | null
          github_url?: string | null
          id?: string
          languages?: string[] | null
          linkedin_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          roll_number?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["app_status"]
          team_members?: Json | null
          team_name?: string | null
          team_size?: number | null
          university?: string | null
          updated_at?: string
          user_id?: string
          xp_earned?: number
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      applied_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applied_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      certificates: {
        Row: {
          created_at: string
          event_id: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          title: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          title: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          title?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_questions: {
        Row: {
          created_at: string
          event_id: string
          field_type: string
          id: string
          label: string
          options: string[] | null
          required: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          event_id: string
          field_type?: string
          id?: string
          label: string
          options?: string[] | null
          required?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          field_type?: string
          id?: string
          label?: string
          options?: string[] | null
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          branch_tags: string[]
          brochure_url: string | null
          category: string | null
          certificate_date: string | null
          city: string | null
          college: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string | null
          discord_url: string | null
          eligibility: string | null
          end_date: string | null
          event_type: string
          goodies: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          is_approved: boolean
          is_featured: boolean
          is_free: boolean
          is_team_based: boolean
          latitude: number | null
          linkedin_url: string | null
          logo_url: string | null
          longitude: number | null
          max_seats: number | null
          max_team_size: number | null
          min_team_size: number | null
          mode: string
          official_website: string | null
          organizer: string
          phone: string | null
          popularity: number
          prerequisites: string | null
          price: number | null
          prize_pool: number | null
          problem_statement_url: string | null
          registered_count: number
          registration_deadline: string | null
          registration_opens_at: string | null
          registration_type: string
          registration_url: string
          result_date: string | null
          rulebook_url: string | null
          schedule_url: string | null
          seats_left: number | null
          short_description: string | null
          slug: string
          start_date: string
          state: string | null
          status: string | null
          tech_tags: string[]
          theme: string | null
          title: string
          travel_support: string | null
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          branch_tags?: string[]
          brochure_url?: string | null
          category?: string | null
          certificate_date?: string | null
          city?: string | null
          college?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          difficulty?: string | null
          discord_url?: string | null
          eligibility?: string | null
          end_date?: string | null
          event_type: string
          goodies?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          is_free?: boolean
          is_team_based?: boolean
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          max_seats?: number | null
          max_team_size?: number | null
          min_team_size?: number | null
          mode: string
          official_website?: string | null
          organizer: string
          phone?: string | null
          popularity?: number
          prerequisites?: string | null
          price?: number | null
          prize_pool?: number | null
          problem_statement_url?: string | null
          registered_count?: number
          registration_deadline?: string | null
          registration_opens_at?: string | null
          registration_type?: string
          registration_url: string
          result_date?: string | null
          rulebook_url?: string | null
          schedule_url?: string | null
          seats_left?: number | null
          short_description?: string | null
          slug: string
          start_date: string
          state?: string | null
          status?: string | null
          tech_tags?: string[]
          theme?: string | null
          title: string
          travel_support?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          branch_tags?: string[]
          brochure_url?: string | null
          category?: string | null
          certificate_date?: string | null
          city?: string | null
          college?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string | null
          discord_url?: string | null
          eligibility?: string | null
          end_date?: string | null
          event_type?: string
          goodies?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          is_free?: boolean
          is_team_based?: boolean
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          max_seats?: number | null
          max_team_size?: number | null
          min_team_size?: number | null
          mode?: string
          official_website?: string | null
          organizer?: string
          phone?: string | null
          popularity?: number
          prerequisites?: string | null
          price?: number | null
          prize_pool?: number | null
          problem_statement_url?: string | null
          registered_count?: number
          registration_deadline?: string | null
          registration_opens_at?: string | null
          registration_type?: string
          registration_url?: string
          result_date?: string | null
          rulebook_url?: string | null
          schedule_url?: string | null
          seats_left?: number | null
          short_description?: string | null
          slug?: string
          start_date?: string
          state?: string | null
          status?: string | null
          tech_tags?: string[]
          theme?: string | null
          title?: string
          travel_support?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          application_id: string
          created_at: string
          id: string
          invoice_number: string
          method: string
          order_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          application_id: string
          created_at?: string
          id?: string
          invoice_number?: string
          method: string
          order_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string
          user_id: string
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string
          id?: string
          invoice_number?: string
          method?: string
          order_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch: string | null
          college: string | null
          created_at: string
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
          interests: string[]
          linkedin_url: string | null
          preferred_locations: string[]
          skills: string[]
          updated_at: string
          xp_points: number
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id: string
          interests?: string[]
          linkedin_url?: string | null
          preferred_locations?: string[]
          skills?: string[]
          updated_at?: string
          xp_points?: number
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          college?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          interests?: string[]
          linkedin_url?: string | null
          preferred_locations?: string[]
          skills?: string[]
          updated_at?: string
          xp_points?: number
          year?: string | null
        }
        Relationships: []
      }
      saved_events: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      app_status:
        | "pending"
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "accepted"
        | "rejected"
        | "completed"
        | "waitlisted"
      payment_status:
        | "not_required"
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
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
    Enums: {
      app_role: ["admin", "user"],
      app_status: [
        "pending",
        "submitted",
        "under_review",
        "shortlisted",
        "accepted",
        "rejected",
        "completed",
        "waitlisted",
      ],
      payment_status: ["not_required", "pending", "paid", "failed", "refunded"],
    },
  },
} as const
