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
      ads: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          partner_id: string | null
          target_url: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          partner_id?: string | null
          target_url?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          partner_id?: string | null
          target_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          scope: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          scope?: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          scope?: string
          type?: string | null
        }
        Relationships: []
      }
      budget_entries: {
        Row: {
          amount_cents: number
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          mode: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          mode?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          mode?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      carpool_terms_acceptance: {
        Row: {
          accepted_at: string | null
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          available: boolean | null
          bio: string | null
          created_at: string | null
          id: string
          specialisation: string | null
          user_id: string
        }
        Insert: {
          available?: boolean | null
          bio?: string | null
          created_at?: string | null
          id?: string
          specialisation?: string | null
          user_id: string
        }
        Update: {
          available?: boolean | null
          bio?: string | null
          created_at?: string | null
          id?: string
          specialisation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      commission_declarations: {
        Row: {
          amount_cents: number
          declared_at: string | null
          handler_id: string
          id: string
          status: string | null
          submission_id: string | null
        }
        Insert: {
          amount_cents: number
          declared_at?: string | null
          handler_id: string
          id?: string
          status?: string | null
          submission_id?: string | null
        }
        Update: {
          amount_cents?: number
          declared_at?: string | null
          handler_id?: string
          id?: string
          status?: string | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_declarations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          partner_id: string | null
          title: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          partner_id?: string | null
          title: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          partner_id?: string | null
          title?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          started_at: string | null
          status: string | null
          submission_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          submission_id?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          submission_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagements_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      handler_assignments: {
        Row: {
          assigned_at: string | null
          handler_id: string
          id: string
          status: string | null
          submission_id: string
        }
        Insert: {
          assigned_at?: string | null
          handler_id: string
          id?: string
          status?: string | null
          submission_id: string
        }
        Update: {
          assigned_at?: string | null
          handler_id?: string
          id?: string
          status?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handler_assignments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      handler_queue: {
        Row: {
          handler_id: string | null
          id: string
          picked_at: string | null
          priority: number | null
          queued_at: string | null
          submission_id: string
        }
        Insert: {
          handler_id?: string | null
          id?: string
          picked_at?: string | null
          priority?: number | null
          queued_at?: string | null
          submission_id: string
        }
        Update: {
          handler_id?: string | null
          id?: string
          picked_at?: string | null
          priority?: number | null
          queued_at?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handler_queue_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acknowledgements: {
        Row: {
          acknowledged_at: string | null
          document_type: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          acknowledged_at?: string | null
          document_type: string
          id?: string
          user_id: string
          version: string
        }
        Update: {
          acknowledged_at?: string | null
          document_type?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      operations_flags: {
        Row: {
          created_at: string | null
          flagged_by: string | null
          id: string
          reason: string | null
          resolved_at: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          flagged_by?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          flagged_by?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      partner_payouts: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          partner_id: string
          payout_date: string | null
          status: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          partner_id: string
          payout_date?: string | null
          status?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          partner_id?: string
          payout_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean | null
          contact_email: string | null
          created_at: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          active?: boolean | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          active?: boolean | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_name: string | null
          board_id: string | null
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author_name?: string | null
          board_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author_name?: string | null
          board_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          delivery_preference: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          personal_email: string | null
          university_email: string | null
          university_or_field: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          delivery_preference?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          personal_email?: string | null
          university_email?: string | null
          university_or_field?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          delivery_preference?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          personal_email?: string | null
          university_email?: string | null
          university_or_field?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_cents: number
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string | null
          status: string | null
          submission_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          submission_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          submission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price_cents: number | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price_cents?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price_cents?: number | null
        }
        Relationships: []
      }
      spot_checks: {
        Row: {
          checked_at: string | null
          checked_by: string
          id: string
          notes: string | null
          result: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          checked_at?: string | null
          checked_by: string
          id?: string
          notes?: string | null
          result?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string
          id?: string
          notes?: string | null
          result?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assigned_at: string | null
          created_at: string | null
          delivered_at: string | null
          handler_id: string | null
          id: string
          in_queue_at: string | null
          in_review_at: string | null
          notes: string | null
          service_id: string | null
          stage: Database["public"]["Enums"]["submission_stage"] | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          handler_id?: string | null
          id?: string
          in_queue_at?: string | null
          in_review_at?: string | null
          notes?: string | null
          service_id?: string | null
          stage?: Database["public"]["Enums"]["submission_stage"] | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          handler_id?: string | null
          id?: string
          in_queue_at?: string | null
          in_review_at?: string | null
          notes?: string | null
          service_id?: string | null
          stage?: Database["public"]["Enums"]["submission_stage"] | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_revisions: {
        Row: {
          created_at: string | null
          id: string
          revised_by: string
          revision_notes: string | null
          submission_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          revised_by: string
          revision_notes?: string | null
          submission_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          revised_by?: string
          revision_notes?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_revisions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "handler"
        | "coach"
        | "operations"
      submission_stage:
        | "submitted"
        | "in_queue"
        | "assigned"
        | "in_review"
        | "delivered"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "handler",
        "coach",
        "operations",
      ],
      submission_stage: [
        "submitted",
        "in_queue",
        "assigned",
        "in_review",
        "delivered",
      ],
    },
  },
} as const
