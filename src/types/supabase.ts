
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
  gps?: Json | null;
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
