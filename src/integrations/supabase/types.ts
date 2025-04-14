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
      api_key_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          key_name: string
          success: boolean
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          key_name: string
          success?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          key_name?: string
          success?: boolean
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_name: string
          key_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          key_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          key_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_builds: {
        Row: {
          app_name: string
          budget_usage: number | null
          build_log: Json | null
          code: string | null
          export_url: string | null
          id: string
          preview_url: string | null
          production_url: string | null
          prompt: string
          spec: string | null
          status: string
          timestamp: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          app_name: string
          budget_usage?: number | null
          build_log?: Json | null
          code?: string | null
          export_url?: string | null
          id?: string
          preview_url?: string | null
          production_url?: string | null
          prompt: string
          spec?: string | null
          status?: string
          timestamp?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          app_name?: string
          budget_usage?: number | null
          build_log?: Json | null
          code?: string | null
          export_url?: string | null
          id?: string
          preview_url?: string | null
          production_url?: string | null
          prompt?: string
          spec?: string | null
          status?: string
          timestamp?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      images: {
        Row: {
          accuracy_date: number | null
          accuracy_description: number | null
          accuracy_historical: number | null
          accuracy_location: number | null
          accuracy_maturity: number | null
          accuracy_realness: number | null
          country: string | null
          created_at: string | null
          date: string | null
          description: string | null
          description_image_url: string | null
          detailed_description: string | null
          gps: Json | null
          hints: Json | null
          id: string
          image_url: string | null
          is_ai_generated: boolean | null
          is_mature_content: boolean | null
          is_true_event: boolean | null
          location: string | null
          manual_override: boolean | null
          ready_for_game: boolean | null
          short_description: string | null
          source: string | null
          title: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          accuracy_date?: number | null
          accuracy_description?: number | null
          accuracy_historical?: number | null
          accuracy_location?: number | null
          accuracy_maturity?: number | null
          accuracy_realness?: number | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          description_image_url?: string | null
          detailed_description?: string | null
          gps?: Json | null
          hints?: Json | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          is_mature_content?: boolean | null
          is_true_event?: boolean | null
          location?: string | null
          manual_override?: boolean | null
          ready_for_game?: boolean | null
          short_description?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          accuracy_date?: number | null
          accuracy_description?: number | null
          accuracy_historical?: number | null
          accuracy_location?: number | null
          accuracy_maturity?: number | null
          accuracy_realness?: number | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          description_image_url?: string | null
          detailed_description?: string | null
          gps?: Json | null
          hints?: Json | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          is_mature_content?: boolean | null
          is_true_event?: boolean | null
          location?: string | null
          manual_override?: boolean | null
          ready_for_game?: boolean | null
          short_description?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      task_logs: {
        Row: {
          context: Json | null
          id: string
          level: string
          message: string
          task_id: string | null
          timestamp: string
        }
        Insert: {
          context?: Json | null
          id: string
          level: string
          message: string
          task_id?: string | null
          timestamp?: string
        }
        Update: {
          context?: Json | null
          id?: string
          level?: string
          message?: string
          task_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_outputs: {
        Row: {
          content: string | null
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_outputs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_agent: string | null
          created_at: string
          dependencies: string[] | null
          description: string
          execution_count: number | null
          id: string
          last_run_at: string | null
          prd_link: string | null
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          verification_criteria: string[] | null
        }
        Insert: {
          assigned_agent?: string | null
          created_at?: string
          dependencies?: string[] | null
          description: string
          execution_count?: number | null
          id: string
          last_run_at?: string | null
          prd_link?: string | null
          priority: string
          project_id: string
          status: string
          title: string
          updated_at?: string
          verification_criteria?: string[] | null
        }
        Update: {
          assigned_agent?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string
          execution_count?: number | null
          id?: string
          last_run_at?: string | null
          prd_link?: string | null
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          verification_criteria?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
