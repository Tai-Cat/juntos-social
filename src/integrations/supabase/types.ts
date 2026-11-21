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
      activities: {
        Row: {
          genre: string
          name: string
        }
        Insert: {
          genre?: string
          name: string
        }
        Update: {
          genre?: string
          name?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          hide_examples: boolean
          id: boolean
        }
        Insert: {
          hide_examples?: boolean
          id?: boolean
        }
        Update: {
          hide_examples?: boolean
          id?: boolean
        }
        Relationships: []
      }
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
      friend_codes: {
        Row: {
          code: string
          user_id: string
        }
        Insert: {
          code?: string
          user_id: string
        }
        Update: {
          code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_preferences: {
        Row: {
          frequency: string
          friend_id: string
          note: string
          time_window: string
          user_id: string
        }
        Insert: {
          frequency?: string
          friend_id: string
          note?: string
          time_window?: string
          user_id: string
        }
        Update: {
          frequency?: string
          friend_id?: string
          note?: string
          time_window?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_preferences_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          recipient: string
          requester: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient: string
          requester: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient?: string
          requester?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_recipient_fkey"
            columns: ["recipient"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_fkey"
            columns: ["requester"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          created_at: string
          data: string | null
          key: string
          mime: string
          prompt: string
        }
        Insert: {
          created_at?: string
          data?: string | null
          key: string
          mime?: string
          prompt: string
        }
        Update: {
          created_at?: string
          data?: string | null
          key?: string
          mime?: string
          prompt?: string
        }
        Relationships: []
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
      hang_proposals: {
        Row: {
          activity: string
          created_at: string
          ends_at: string
          id: string
          plan_id: string | null
          recipient: string
          sender: string
          starts_at: string
          status: string
          suggestion: string
          time_of_day: string
          window_label: string
        }
        Insert: {
          activity?: string
          created_at?: string
          ends_at: string
          id?: string
          plan_id?: string | null
          recipient: string
          sender: string
          starts_at: string
          status?: string
          suggestion?: string
          time_of_day?: string
          window_label?: string
        }
        Update: {
          activity?: string
          created_at?: string
          ends_at?: string
          id?: string
          plan_id?: string | null
          recipient?: string
          sender?: string
          starts_at?: string
          status?: string
          suggestion?: string
          time_of_day?: string
          window_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "hang_proposals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hang_proposals_recipient_fkey"
            columns: ["recipient"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hang_proposals_sender_fkey"
            columns: ["sender"]
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
      official_requests: {
        Row: {
          created_at: string
          id: string
          note: string
          organisation_id: string
          requested_by: string
          status: string
          website: string | null
          work_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          organisation_id: string
          requested_by: string
          status?: string
          website?: string | null
          work_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          organisation_id?: string
          requested_by?: string
          status?: string
          website?: string | null
          work_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_requests_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_email_checks: {
        Row: {
          attempts: number
          code_hash: string
          email: string
          expires_at: string
          organisation_id: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          email: string
          expires_at: string
          organisation_id: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          email?: string
          expires_at?: string
          organisation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_email_checks_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_email_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_follows: {
        Row: {
          organisation_id: string
          user_id: string
        }
        Insert: {
          organisation_id: string
          user_id: string
        }
        Update: {
          organisation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_follows_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          organisation_id: string
          role: string
          user_id: string
        }
        Insert: {
          organisation_id: string
          role?: string
          user_id: string
        }
        Update: {
          organisation_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_requests: {
        Row: {
          answer: string
          id: string
          organisation_id: string
          status: string
          user_id: string
        }
        Insert: {
          answer: string
          id?: string
          organisation_id: string
          status?: string
          user_id: string
        }
        Update: {
          answer?: string
          id?: string
          organisation_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_requests_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_secrets: {
        Row: {
          organisation_id: string
          passphrase_hash: string | null
        }
        Insert: {
          organisation_id: string
          passphrase_hash?: string | null
        }
        Update: {
          organisation_id?: string
          passphrase_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_secrets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          about: string
          allowed_domains: string[]
          archived: boolean
          category: string
          city: string
          contact_email: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string
          group_discounts: boolean
          id: string
          is_example: boolean
          is_official: boolean
          kind: string
          logo_url: string | null
          name: string
          official_status: string
          parent_id: string | null
          question: string
          section: string
          slug: string
          visibility: string
          website: string | null
        }
        Insert: {
          about?: string
          allowed_domains?: string[]
          archived?: boolean
          category?: string
          city?: string
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          group_discounts?: boolean
          id?: string
          is_example?: boolean
          is_official?: boolean
          kind?: string
          logo_url?: string | null
          name: string
          official_status?: string
          parent_id?: string | null
          question?: string
          section?: string
          slug: string
          visibility?: string
          website?: string | null
        }
        Update: {
          about?: string
          allowed_domains?: string[]
          archived?: boolean
          category?: string
          city?: string
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          group_discounts?: boolean
          id?: string
          is_example?: boolean
          is_official?: boolean
          kind?: string
          logo_url?: string | null
          name?: string
          official_status?: string
          parent_id?: string | null
          question?: string
          section?: string
          slug?: string
          visibility?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_credits: {
        Row: {
          created_at: string
          interest: string | null
          photo: string
          photographer: string
          photographer_url: string
          plan_id: string | null
          provider: string
          provider_id: string
          source_url: string
        }
        Insert: {
          created_at?: string
          interest?: string | null
          photo: string
          photographer: string
          photographer_url: string
          plan_id?: string | null
          provider: string
          provider_id: string
          source_url: string
        }
        Update: {
          created_at?: string
          interest?: string | null
          photo?: string
          photographer?: string
          photographer_url?: string
          plan_id?: string | null
          provider?: string
          provider_id?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_credits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_search_cache: {
        Row: {
          created_at: string
          query: string
          results: Json
        }
        Insert: {
          created_at?: string
          query: string
          results: Json
        }
        Update: {
          created_at?: string
          query?: string
          results?: Json
        }
        Relationships: []
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
      plan_invite_links: {
        Row: {
          inviter: string
          plan_id: string
          token: string
        }
        Insert: {
          inviter: string
          plan_id: string
          token?: string
        }
        Update: {
          inviter?: string
          plan_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_invite_links_inviter_fkey"
            columns: ["inviter"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_invite_links_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_invites: {
        Row: {
          created_at: string
          id: string
          invitee: string
          inviter: string
          plan_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee: string
          inviter: string
          plan_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee?: string
          inviter?: string
          plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_invites_invitee_fkey"
            columns: ["invitee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_invites_inviter_fkey"
            columns: ["inviter"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_invites_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_link_access: {
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
            foreignKeyName: "plan_link_access_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_member_notes: {
        Row: {
          note: string
          plan_id: string
        }
        Insert: {
          note: string
          plan_id: string
        }
        Update: {
          note?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_member_notes_plan_id_fkey"
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
      plan_photo_registry: {
        Row: {
          photo: string
          plan_id: string
        }
        Insert: {
          photo: string
          plan_id: string
        }
        Update: {
          photo?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_photo_registry_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_views: {
        Row: {
          plan_id: string
          viewed_on: string
          viewer: string
        }
        Insert: {
          plan_id: string
          viewed_on?: string
          viewer: string
        }
        Update: {
          plan_id?: string
          viewed_on?: string
          viewer?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_views_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          activity: string
          age_max: number | null
          age_min: number | null
          area_label: string
          area_lat: number | null
          area_lng: number | null
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
          duration_minutes: number
          early_booking: boolean
          ends_at: string | null
          example_host_name: string | null
          example_host_reliability: number | null
          example_host_verified: boolean | null
          genre: string
          going_count: number
          has_virtual_option: boolean
          host_id: string | null
          host_intro: string
          id: string
          image_url: string | null
          interest_only: boolean
          interest_tags: string[]
          is_example: boolean
          is_private: boolean
          is_public_place: boolean
          is_travel: boolean
          kind: string
          link_enabled: boolean
          members_note: string | null
          organisation_id: string | null
          parent_plan_id: string | null
          photos: string[]
          private_participants: string[]
          recurring_weekly: boolean
          required_level: string
          share_token: string
          starts_at: string
          step_free: boolean
          ticket_url: string | null
          title: string
          venue_tbc: boolean
          visibility: string
          what_to_bring: string
        }
        Insert: {
          activity?: string
          age_max?: number | null
          age_min?: number | null
          area_label: string
          area_lat?: number | null
          area_lng?: number | null
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
          duration_minutes?: number
          early_booking?: boolean
          ends_at?: string | null
          example_host_name?: string | null
          example_host_reliability?: number | null
          example_host_verified?: boolean | null
          genre?: string
          going_count?: number
          has_virtual_option?: boolean
          host_id?: string | null
          host_intro?: string
          id?: string
          image_url?: string | null
          interest_only?: boolean
          interest_tags?: string[]
          is_example?: boolean
          is_private?: boolean
          is_public_place?: boolean
          is_travel?: boolean
          kind?: string
          link_enabled?: boolean
          members_note?: string | null
          organisation_id?: string | null
          parent_plan_id?: string | null
          photos?: string[]
          private_participants?: string[]
          recurring_weekly?: boolean
          required_level?: string
          share_token?: string
          starts_at: string
          step_free?: boolean
          ticket_url?: string | null
          title: string
          venue_tbc?: boolean
          visibility?: string
          what_to_bring?: string
        }
        Update: {
          activity?: string
          age_max?: number | null
          age_min?: number | null
          area_label?: string
          area_lat?: number | null
          area_lng?: number | null
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
          duration_minutes?: number
          early_booking?: boolean
          ends_at?: string | null
          example_host_name?: string | null
          example_host_reliability?: number | null
          example_host_verified?: boolean | null
          genre?: string
          going_count?: number
          has_virtual_option?: boolean
          host_id?: string | null
          host_intro?: string
          id?: string
          image_url?: string | null
          interest_only?: boolean
          interest_tags?: string[]
          is_example?: boolean
          is_private?: boolean
          is_public_place?: boolean
          is_travel?: boolean
          kind?: string
          link_enabled?: boolean
          members_note?: string | null
          organisation_id?: string | null
          parent_plan_id?: string | null
          photos?: string[]
          private_participants?: string[]
          recurring_weekly?: boolean
          required_level?: string
          share_token?: string
          starts_at?: string
          step_free?: boolean
          ticket_url?: string | null
          title?: string
          venue_tbc?: boolean
          visibility?: string
          what_to_bring?: string
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
            foreignKeyName: "plans_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
          age_verified: boolean
          date_of_birth: string | null
          gender: string
          gender_other: string | null
          meet_age_max: number | null
          meet_age_min: number | null
          user_id: string
        }
        Insert: {
          age_verified?: boolean
          date_of_birth?: string | null
          gender?: string
          gender_other?: string | null
          meet_age_max?: number | null
          meet_age_min?: number | null
          user_id: string
        }
        Update: {
          age_verified?: boolean
          date_of_birth?: string | null
          gender?: string
          gender_other?: string | null
          meet_age_max?: number | null
          meet_age_min?: number | null
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
      profile_shares: {
        Row: {
          audience: string
          enabled: boolean
          token: string
          user_id: string
        }
        Insert: {
          audience?: string
          enabled?: boolean
          token?: string
          user_id: string
        }
        Update: {
          audience?: string
          enabled?: boolean
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_shares_user_id_fkey"
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
      saved_plans: {
        Row: {
          plan_id: string
          user_id: string
        }
        Insert: {
          plan_id: string
          user_id: string
        }
        Update: {
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_examples: {
        Row: {
          body: string
          id: string
          kind: string
          name: string
          photo: string | null
          plan_id: string | null
          title: string
        }
        Insert: {
          body?: string
          id: string
          kind: string
          name: string
          photo?: string | null
          plan_id?: string | null
          title: string
        }
        Update: {
          body?: string
          id?: string
          kind?: string
          name?: string
          photo?: string | null
          plan_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_examples_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      user_settings: {
        Row: {
          account_type: string
          demo_plus: boolean
          doodle_background: boolean
          gender_plans_only: boolean
          hang_frequency: string
          languages: string[]
          max_distance_km: number
          meet_genders: string[]
          notify_alerts: boolean
          notify_invites: boolean
          notify_messages: boolean
          profile_visibility: string
          user_id: string
        }
        Insert: {
          account_type?: string
          demo_plus?: boolean
          doodle_background?: boolean
          gender_plans_only?: boolean
          hang_frequency?: string
          languages?: string[]
          max_distance_km?: number
          meet_genders?: string[]
          notify_alerts?: boolean
          notify_invites?: boolean
          notify_messages?: boolean
          profile_visibility?: string
          user_id: string
        }
        Update: {
          account_type?: string
          demo_plus?: boolean
          doodle_background?: boolean
          gender_plans_only?: boolean
          hang_frequency?: string
          languages?: string[]
          max_distance_km?: number
          meet_genders?: string[]
          notify_alerts?: boolean
          notify_invites?: boolean
          notify_messages?: boolean
          profile_visibility?: string
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
      are_friends: { Args: { a: string; b: string }; Returns: boolean }
      calendar_friend_plans: {
        Args: never
        Returns: {
          area_label: string
          city: string
          duration_minutes: number
          friend_id: string
          friend_name: string
          genre: string
          image_url: string
          plan_id: string
          recurring_weekly: boolean
          starts_at: string
          title: string
        }[]
      }
      community_interests: {
        Args: never
        Returns: {
          interest: string
          people: number
        }[]
      }
      confirm_org_email_demo: {
        Args: { _code: string; _org: string }
        Returns: boolean
      }
      create_organisation: {
        Args: {
          _category: string
          _city: string
          _cover?: string
          _description: string
          _email?: string
          _kind: string
          _name: string
          _passphrase?: string
          _question: string
          _slug: string
          _visibility: string
          _website?: string
        }
        Returns: string
      }
      create_subgroup: {
        Args: {
          _description: string
          _name: string
          _parent: string
          _question?: string
          _section: string
          _slug: string
        }
        Returns: string
      }
      delete_all_examples: { Args: never; Returns: number }
      delete_org: { Args: { _org: string }; Returns: undefined }
      demo_confirm_age: { Args: { _dob: string }; Returns: undefined }
      edit_org: {
        Args: {
          _description: string
          _domains: string[]
          _org: string
          _passphrase?: string
          _question: string
          _visibility: string
        }
        Returns: undefined
      }
      find_people: {
        Args: { _search: string }
        Returns: {
          id: string
          interests: string[]
          name: string
          verified: boolean
        }[]
      }
      friends_going: {
        Args: { _plan?: string }
        Returns: {
          name: string
          person_id: string
          plan_id: string
        }[]
      }
      get_plan_address: { Args: { _plan: string }; Returns: string }
      hang_candidates: {
        Args: never
        Returns: {
          last_met: string
          name: string
          person_id: string
          title: string
        }[]
      }
      has_plan_link_access: {
        Args: { _plan: string; _user: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_teaser: {
        Args: { _token: string }
        Returns: {
          area_label: string
          image_url: string
          inviter_name: string
          plan_id: string
          starts_at: string
          title: string
        }[]
      }
      is_plan_host: { Args: { _plan: string; _user: string }; Returns: boolean }
      is_plan_member: {
        Args: { _plan: string; _user: string }
        Returns: boolean
      }
      leave_org: { Args: { _org: string }; Returns: undefined }
      mark_no_show: { Args: { _request: string }; Returns: undefined }
      open_plan_link: { Args: { _token: string }; Returns: string }
      org_access: { Args: { _org: string; _user: string }; Returns: boolean }
      org_admin: { Args: { _org: string; _user: string }; Returns: boolean }
      org_analytics: {
        Args: { _org: string }
        Returns: {
          going: number
          plan_id: string
          saves: number
          starts_at: string
          title: string
          views: number
        }[]
      }
      org_host: { Args: { _org: string; _user: string }; Returns: boolean }
      org_member: { Args: { _org: string; _user: string }; Returns: boolean }
      org_plan_teasers: {
        Args: { _org?: string; _plan?: string }
        Returns: {
          activity: string
          age_max: number
          age_min: number
          area_label: string
          base_price: number
          city: string
          genre: string
          id: string
          image_url: string
          is_example: boolean
          organisation_id: string
          starts_at: string
          title: string
        }[]
      }
      people_blocked: { Args: { a: string; b: string }; Returns: boolean }
      plan_link_teaser: {
        Args: { _token: string }
        Returns: {
          activity: string
          area_label: string
          city: string
          genre: string
          host_name: string
          id: string
          image_url: string
          starts_at: string
          title: string
        }[]
      }
      public_host: {
        Args: { _id: string }
        Returns: {
          name: string
          reliability_score: number
          verified: boolean
        }[]
      }
      redeem_friend_code: { Args: { _code: string }; Returns: undefined }
      remove_org_member: {
        Args: { _org: string; _user: string }
        Returns: undefined
      }
      repeat_plan: { Args: { _plan: string }; Returns: string }
      request_official: {
        Args: { _email: string; _note: string; _org: string; _website: string }
        Returns: undefined
      }
      request_org_access: {
        Args: { _answer: string; _org: string }
        Returns: string
      }
      reset_plan_link: { Args: { _plan: string }; Returns: string }
      respond_friend: {
        Args: { _accept: boolean; _id: string }
        Returns: undefined
      }
      respond_invite: {
        Args: { _id: string; _status: string }
        Returns: string
      }
      respond_invite_link: {
        Args: { _status: string; _token: string }
        Returns: string
      }
      respond_proposal: {
        Args: { _action: string; _id: string; _suggestion?: string }
        Returns: string
      }
      review_official: {
        Args: { _approve: boolean; _request: string }
        Returns: undefined
      }
      review_org_request: {
        Args: { _approve: boolean; _request: string }
        Returns: undefined
      }
      save_private_profile: {
        Args: {
          _dob: string
          _gender: string
          _max?: number
          _min?: number
          _other: string
        }
        Returns: undefined
      }
      set_hide_examples: { Args: { _hide: boolean }; Returns: undefined }
      set_org_member_role: {
        Args: { _org: string; _role: string; _user: string }
        Returns: undefined
      }
      shared_plan_count: { Args: { a: string; b: string }; Returns: number }
      shared_profile_plans: {
        Args: { _token: string }
        Returns: {
          area_label: string
          city: string
          id: string
          image_url: string
          owner_name: string
          starts_at: string
          title: string
        }[]
      }
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
      start_org_email_demo: {
        Args: { _email: string; _org: string }
        Returns: string
      }
      update_org_profile: {
        Args: {
          _category: string
          _city: string
          _cover: string
          _email: string
          _group_discounts: boolean
          _logo: string
          _name: string
          _org: string
          _website: string
        }
        Returns: undefined
      }
      update_subgroup: {
        Args: {
          _archived: boolean
          _name: string
          _org: string
          _section: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
