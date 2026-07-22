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
      events: {
        Row: {
          branch_tags: string[]
          city: string | null
          college: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string | null
          end_date: string | null
          event_type: string
          id: string
          image_url: string | null
          is_approved: boolean
          is_featured: boolean
          is_free: boolean
          latitude: number | null
          longitude: number | null
          mode: string
          official_website: string | null
          organizer: string
          popularity: number
          price: number | null
          prize_pool: number | null
          registration_deadline: string | null
          registration_url: string
          seats_left: number | null
          short_description: string | null
          slug: string
          start_date: string
          state: string | null
          tech_tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          branch_tags?: string[]
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          difficulty?: string | null
          end_date?: string | null
          event_type: string
          id?: string
          image_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          is_free?: boolean
          latitude?: number | null
          longitude?: number | null
          mode: string
          official_website?: string | null
          organizer: string
          popularity?: number
          price?: number | null
          prize_pool?: number | null
          registration_deadline?: string | null
          registration_url: string
          seats_left?: number | null
          short_description?: string | null
          slug: string
          start_date: string
          state?: string | null
          tech_tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          branch_tags?: string[]
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          is_free?: boolean
          latitude?: number | null
          longitude?: number | null
          mode?: string
          official_website?: string | null
          organizer?: string
          popularity?: number
          price?: number | null
          prize_pool?: number | null
          registration_deadline?: string | null
          registration_url?: string
          seats_left?: number | null
          short_description?: string | null
          slug?: string
          start_date?: string
          state?: string | null
          tech_tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
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
    },
  },
} as const
