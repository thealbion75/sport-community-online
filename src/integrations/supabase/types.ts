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
      admin_roles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          location: string
          logo_url: string | null
          name: string
          sport_types: string[]
          updated_at: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location: string
          logo_url?: string | null
          name: string
          sport_types?: string[]
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          logo_url?: string | null
          name?: string
          sport_types?: string[]
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          moderator_id: string
          reason: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          moderator_id: string
          reason: string
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          moderator_id?: string
          reason?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      sports_council_admins: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sports_council_meetings: {
        Row: {
          agenda: string | null
          created_at: string
          id: string
          is_public: boolean
          location: string | null
          meeting_date: string
          meeting_time: string | null
          minutes: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          location?: string | null
          meeting_date: string
          meeting_time?: string | null
          minutes?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          location?: string | null
          meeting_date?: string
          meeting_time?: string | null
          minutes?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          applied_at: string
          id: string
          message: string | null
          opportunity_id: string
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          message?: string | null
          opportunity_id: string
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          message?: string | null
          opportunity_id?: string
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: []
      }
      volunteer_opportunities: {
        Row: {
          club_id: string
          created_at: string
          description: string
          end_date: string | null
          id: string
          is_recurring: boolean
          location: string | null
          required_skills: string[]
          start_date: string | null
          status: string
          time_commitment: string
          title: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          required_skills?: string[]
          start_date?: string | null
          status?: string
          time_commitment: string
          title: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          is_recurring?: boolean
          location?: string | null
          required_skills?: string[]
          start_date?: string | null
          status?: string
          time_commitment?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_profiles: {
        Row: {
          availability: string[]
          bio: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_visible: boolean
          last_name: string
          location: string | null
          phone: string | null
          profile_image_url: string | null
          skills: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string[]
          bio?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_visible?: boolean
          last_name: string
          location?: string | null
          phone?: string | null
          profile_image_url?: string | null
          skills?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string[]
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_visible?: boolean
          last_name?: string
          location?: string | null
          phone?: string | null
          profile_image_url?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      club_meeting_times: {
        Row: {
          club_id: string
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          day_of_week: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_meeting_times_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_profiles: {
        Row: {
          address: string | null
          approved: boolean
          category: string
          city: string | null
          club_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string
          facebook_url: string | null
          google_maps_url: string | null
          id: string
          instagram_url: string | null
          postcode: string | null
          twitter_url: string | null
          updated_at: string
          website: string | null
          what3words: string | null
        }
        Insert: {
          address?: string | null
          approved?: boolean
          category: string
          city?: string | null
          club_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description: string
          facebook_url?: string | null
          google_maps_url?: string | null
          id: string
          instagram_url?: string | null
          postcode?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          what3words?: string | null
        }
        Update: {
          address?: string | null
          approved?: boolean
          category?: string
          city?: string | null
          club_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          facebook_url?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_url?: string | null
          postcode?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
          what3words?: string | null
        }
        Relationships: []
      }
      club_volunteer_positions: {
        Row: {
          club_id: string
          contact_info: string | null
          created_at: string
          description: string
          id: string
          is_live: boolean
          location: string | null
          requirements: string | null
          responsibilities: string | null
          time_commitment: string | null
          title: string
          updated_at: string
        }
        Insert: {
          club_id: string
          contact_info?: string | null
          created_at?: string
          description: string
          id?: string
          is_live?: boolean
          location?: string | null
          requirements?: string | null
          responsibilities?: string | null
          time_commitment?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          contact_info?: string | null
          created_at?: string
          description?: string
          id?: string
          is_live?: boolean
          location?: string | null
          requirements?: string | null
          responsibilities?: string | null
          time_commitment?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_volunteer_positions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_categories: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_platform_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      moderate_content: {
        Args: {
          content_id: string
          content_type: string
          moderation_action: string
          moderation_reason: string
        }
        Returns: undefined
      }
      suspend_user: {
        Args: {
          user_id: string
          suspension_reason: string
        }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
