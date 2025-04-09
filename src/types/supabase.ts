
export interface ImageDB {
  id: string;
  title?: string;
  description?: string;
  image_url?: string;
  date?: string;
  year?: number;
  location?: string;
  country?: string;
  is_ai_generated?: boolean;
  is_true_event?: boolean;
  created_at?: string;
  updated_at?: string;
  ready_for_game?: boolean;
  gps?: JSON | null;
  short_description?: string;
  detailed_description?: string;
  hints?: any | null;
  source?: string;
  manual_override?: boolean;
  description_image_url?: string;
  is_mature_content?: boolean;
  accuracy_historical?: number;
  accuracy_description?: number;
  accuracy_date?: number;
  accuracy_location?: number;
  accuracy_maturity?: number;
  accuracy_realness?: number;
  
  // Add these missing properties
  image_mobile_url?: string;
  image_tablet_url?: string;
  image_desktop_url?: string;
}

export interface AppBuild {
  id: string;
  prompt: string;
  status: 'processing' | 'complete' | 'failed';
  timestamp: string;
  previewUrl?: string;
  exportUrl?: string;
  appName: string;
  created_at: string;
}

export interface AppBuildDB {
  id: string;
  prompt: string;
  status: string;
  timestamp: string;
  preview_url?: string;
  export_url?: string;
  app_name: string;
  code?: string;
  spec?: string;
  build_log?: any[];
}

export interface ProcessedImage {
  id: string;
  title?: string;
  description?: string;
  image_url?: string;
  date?: string;
  location?: string;
  accuracy?: number;
  verified?: boolean;
}

export interface ImageGenerationResponse {
  status: string;
  message: string;
  data?: any;
}

export interface ImageGenerationRow {
  id: string;
  prompt: string;
  status: string;
  image_url?: string;
  created_at: string;
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface WriterPromptEntry {
  id: string;
  prompt: string;
  result?: string;
  status: string;
  created_at: string;
}

export interface WriterResponse {
  id: string;
  content: string;
  metadata?: any;
}
