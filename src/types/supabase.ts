
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
