
// Custom types for tables not yet reflected in the generated Supabase types

export interface AppBuildDB {
  id: string;
  user_id: string;
  prompt: string;
  app_name: string;
  status: 'processing' | 'complete' | 'failed';
  spec?: string;
  code?: string;
  preview_url?: string;
  production_url?: string;
  export_url?: string;
  timestamp: string;
  updated_at: string;
  build_log?: any[];
  budget_usage?: number;
}

export interface AppBuild {
  id: string;
  prompt: string;
  status: 'processing' | 'complete' | 'failed';
  timestamp: string;
  previewUrl?: string;
  exportUrl?: string;
  appName: string;
  created_at?: string; // Added this field to match usage in Pilot.tsx
}

export interface GeneratedAppDB {
  id: string;
  build_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'deployed' | 'archived';
  repository_url?: string;
  deployment_url?: string;
  created_at: string;
  updated_at: string;
  monthly_cost?: number;
  is_public: boolean;
}

export interface AppComponentDB {
  id: string;
  app_id: string;
  name: string;
  type: string;
  content?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// Interface for image data coming from the database
export interface ImageDataDB {
  id: string;
  title: string | null;
  description: string | null;
  date: string | null;
  year: number | null;
  location: string | null;
  gps: any | null;
  is_true_event: boolean | null;
  is_ai_generated: boolean | null;
  ready_for_game: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
  description_image_url: string | null;
  is_mature_content?: boolean | null;
  accuracy_description?: number | null;
  accuracy_date?: number | null;
  accuracy_location?: number | null;
  accuracy_historical?: number | null;
  accuracy_realness?: number | null;
  accuracy_maturity?: number | null;
  manual_override?: boolean | null;
}
