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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hang_again: {
        Row: {
          created_at: string
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hang_again_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hang_again_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_levels: {
        Row: {
          interest: string
          level: string
          user_id: string
        }
        Insert: {
          interest: string
          level?: string
          user_id: string
        }
        Update: {
          interest?: string
          level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_levels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          bring_buddy: boolean
          created_at: string
          id: string
          no_show: boolean
          plan_id: string
          status: string
          user_id: string
        }
        Insert: {
          bring_buddy?: boolean
          created_at?: string
          id?: string
          no_show?: boolean
          plan_id: string
          status?: string
          user_id: string
        }
        Update: {
          bring_buddy?: boolean
          created_at?: string
          id?: string
          no_show?: boolean
          plan_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          alert_id: string | null
          created_at: string
          id: string
          plan_id: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          id?: string
          plan_id?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          id?: string
          plan_id?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "saved_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_addresses: {
        Row: {
          address: string
          plan_id: string
        }
        Insert: {
          address: string
          plan_id: string
        }
        Update: {
          address?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_addresses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_messages_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          activity: string
          area_label: string
          audience: string
          auto_approve: boolean
          base_going: number
          base_price: number
          capacity: number
          category: string
          city: string
          country: string
          created_at: string
          description: string | null
          example_host_name: string | null
          example_host_reliability: number | null
          example_host_verified: boolean | null
          genre: string
          going_count: number
          host_id: string | null
          id: string
          image_url: string | null
          is_example: boolean
          is_public_place: boolean
          is_travel: boolean
          kind: string
          parent_plan_id: string | null
          recurring_weekly: boolean
          required_level: string
          starts_at: string
          step_free: boolean
          title: string
        }
        Insert: {
          activity?: string
          area_label: string
          audience?: string
          auto_approve?: boolean
          base_going?: number
          base_price?: number
          capacity?: number
          category: string
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          example_host_name?: string | null
          example_host_reliability?: number | null
          example_host_verified?: boolean | null
          genre?: string
          going_count?: number
          host_id?: string | null
          id?: string
          image_url?: string | null
          is_example?: boolean
          is_public_place?: boolean
          is_travel?: boolean
          kind?: string
          parent_plan_id?: string | null
          recurring_weekly?: boolean
          required_level?: string
          starts_at: string
          step_free?: boolean
          title: string
        }
        Update: {
          activity?: string
          area_label?: string
          audience?: string
          auto_approve?: boolean
          base_going?: number
          base_price?: number
          capacity?: number
          category?: string
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          example_host_name?: string | null
          example_host_reliability?: number | null
          example_host_verified?: boolean | null
          genre?: string
          going_count?: number
          host_id?: string | null
          id?: string
          image_url?: string | null
          is_example?: boolean
          is_public_place?: boolean
          is_travel?: boolean
          kind?: string
          parent_plan_id?: string | null
          recurring_weekly?: boolean
          required_level?: string
          starts_at?: string
          step_free?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_parent_plan_id_fkey"
            columns: ["parent_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          gender: string
          gender_other: string | null
          user_id: string
        }
        Insert: {
          gender?: string
          gender_other?: string | null
          user_id: string
        }
        Update: {
          gender?: string
          gender_other?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          home_city: string
          id: string
          interests: string[]
          learning_interests: string[]
          name: string
          no_show_count: number
          onboarded: boolean
          pronouns: string | null
          reliability_score: number
          verified: boolean
        }
        Insert: {
          created_at?: string
          home_city?: string
          id: string
          interests?: string[]
          learning_interests?: string[]
          name?: string
          no_show_count?: number
          onboarded?: boolean
          pronouns?: string | null
          reliability_score?: number
          verified?: boolean
        }
        Update: {
          created_at?: string
          home_city?: string
          id?: string
          interests?: string[]
          learning_interests?: string[]
          name?: string
          no_show_count?: number
          onboarded?: boolean
          pronouns?: string | null
          reliability_score?: number
          verified?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          target_plan_id: string | null
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          target_plan_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          target_plan_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_plan_id_fkey"
            columns: ["target_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_alerts: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          city: string
          country: string
          created_at: string
          end_date: string
          example_name: string | null
          example_verified: boolean | null
          id: string
          interests: string[]
          is_example: boolean
          start_date: string
          user_id: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          end_date: string
          example_name?: string | null
          example_verified?: boolean | null
          id?: string
          interests?: string[]
          is_example?: boolean
          start_date: string
          user_id?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          end_date?: string
          example_name?: string | null
          example_verified?: boolean | null
          id?: string
          interests?: string[]
          is_example?: boolean
          start_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          demo_plus: boolean
          user_id: string
        }
        Insert: {
          demo_plus?: boolean
          user_id: string
        }
        Update: {
          demo_plus?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waves: {
        Row: {
          created_at: string
          from_user: string
          id: string
          to_trip: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          to_trip: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          to_trip?: string
        }
        Relationships: [
          {
            foreignKeyName: "waves_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waves_to_trip_fkey"
            columns: ["to_trip"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      alert_matches: {
        Args: { f: Json; p: Database["public"]["Tables"]["plans"]["Row"] }
        Returns: boolean
      }
      get_plan_address: { Args: { _plan: string }; Returns: string }
      is_plan_host: { Args: { _plan: string; _user: string }; Returns: boolean }
      is_plan_member: {
        Args: { _plan: string; _user: string }
        Returns: boolean
      }
      mark_no_show: { Args: { _request: string }; Returns: undefined }
      people_blocked: { Args: { a: string; b: string }; Returns: boolean }
      repeat_plan: { Args: { _plan: string }; Returns: string }
      similar_people: {
        Args: {
          _activity?: string
          _city: string
          _interests: string[]
          _level?: string
        }
        Returns: {
          created_at: string
          home_city: string
          id: string
          interests: string[]
          learning_interests: string[]
          name: string
          no_show_count: number
          onboarded: boolean
          pronouns: string | null
          reliability_score: number
          verified: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
