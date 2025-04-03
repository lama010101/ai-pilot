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
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          created_at: string
          id: string
          round_results: Json
          session_id: string
          total_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          round_results: Json
          session_id: string
          total_score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          round_results?: Json
          session_id?: string
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          creator_id: string
          events: Json[] | null
          game_mode: string
          id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          events?: Json[] | null
          game_mode?: string
          id?: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          events?: Json[] | null
          game_mode?: string
          id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hints_wallet: {
        Row: {
          created_at: string
          hint_coins: number
          id: string
          last_ad_watched: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hint_coins?: number
          id?: string
          last_ad_watched?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hint_coins?: number
          id?: string
          last_ad_watched?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      historical_events: {
        Row: {
          country: string | null
          created_at: string
          deleted: boolean
          description: string
          id: string
          image_attribution: string | null
          image_license: string | null
          image_url: string | null
          latitude: number
          location_name: string
          longitude: number
          year: number
        }
        Insert: {
          country?: string | null
          created_at?: string
          deleted?: boolean
          description: string
          id?: string
          image_attribution?: string | null
          image_license?: string | null
          image_url?: string | null
          latitude: number
          location_name: string
          longitude: number
          year: number
        }
        Update: {
          country?: string | null
          created_at?: string
          deleted?: boolean
          description?: string
          id?: string
          image_attribution?: string | null
          image_license?: string | null
          image_url?: string | null
          latitude?: number
          location_name?: string
          longitude?: number
          year?: number
        }
        Relationships: []
      }
      images: {
        Row: {
          address: string | null
          ai_description: string | null
          confidence_score: number | null
          country: string | null
          created_at: string
          date: string | null
          id: string
          image_url: string
          latitude: number | null
          longitude: number | null
          prompt: string
          raw_context: string | null
          ready_for_game: boolean
          source_app: string
          source_name: string
          tag: string | null
          title: string | null
        }
        Insert: {
          address?: string | null
          ai_description?: string | null
          confidence_score?: number | null
          country?: string | null
          created_at?: string
          date?: string | null
          id?: string
          image_url: string
          latitude?: number | null
          longitude?: number | null
          prompt: string
          raw_context?: string | null
          ready_for_game?: boolean
          source_app: string
          source_name: string
          tag?: string | null
          title?: string | null
        }
        Update: {
          address?: string | null
          ai_description?: string | null
          confidence_score?: number | null
          country?: string | null
          created_at?: string
          date?: string | null
          id?: string
          image_url?: string
          latitude?: number | null
          longitude?: number | null
          prompt?: string
          raw_context?: string | null
          ready_for_game?: boolean
          source_app?: string
          source_name?: string
          tag?: string | null
          title?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          game_id: string | null
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          game_id?: string | null
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_distance_unit: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_distance_unit?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_distance_unit?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_game_with_participants: {
        Args: {
          creator_id: string
          config: Json
          participant_ids: string[]
        }
        Returns: string
      }
      get_accepted_friends: {
        Args: {
          user_id: string
        }
        Returns: {
          friend_id: string
          username: string
          avatar_url: string
          friendship_start: string
        }[]
      }
      get_notifications_with_sender: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          sender_id: string
          receiver_id: string
          type: string
          message: string
          created_at: string
          read: boolean
          game_id: string
          sender: Json
        }[]
      }
      get_scraper_logs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_scraper_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      mark_all_notifications_as_read: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      mark_notification_as_read: {
        Args: {
          notification_id: string
        }
        Returns: undefined
      }
      update_scraper_settings: {
        Args: {
          settings_json: Json
        }
        Returns: Json
      }
    }
    Enums: {
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
