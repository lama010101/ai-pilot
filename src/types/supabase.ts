import { Json } from '@/integrations/supabase/types';

export interface ImageDB {
  id: string;
  title: string | null;
  description: string | null;
  date: string | null;
  year: number | null;
  location: string | null;
  gps: Json | null;
  is_true_event: boolean | null;
  is_ai_generated: boolean | null;
  ready_for_game: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
  description_image_url: string | null;
  
  // Add these new properties for responsive images
  image_mobile_url: string | null;
  image_tablet_url: string | null;
  image_desktop_url: string | null;

  // Extended fields
  is_mature_content: boolean | null;
  accuracy_description: number | null;
  accuracy_date: number | null;
  accuracy_location: number | null;
  accuracy_historical: number | null;
  accuracy_realness: number | null;
  accuracy_maturity: number | null;
  manual_override: boolean | null;
  source: string | null;
  hints: any | null;  // Added for writer hints
  country: string | null;  // Added for writer country
  short_description: string | null;  // Added for writer short description
  detailed_description: string | null;  // Added for writer detailed description
}

// Define the ProcessedImage interface for image handling
export interface ProcessedImage {
  originalFileName: string;
  metadata: any;
  imageUrl: string;
  descriptionImageUrl: string;
  mobileUrl: string;
  tabletUrl: string;
  desktopUrl: string;
  ready_for_game: boolean;
  selected: boolean;
}

// Define ImageDataDB interface
export interface ImageDataDB {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  // Add other fields as needed
}

// Define GPSCoordinates interface
export interface GPSCoordinates {
  lat: number;
  lng: number;
  lon?: number; // Add lon as optional for compatibility
}

// Define ImageGenerationRow interface
export interface ImageGenerationRow {
  title: string;
  description: string;
  year: number;
  gps: GPSCoordinates;
  date?: string;
  address?: string;
  mature?: boolean;
  true_event?: boolean;
}

// Define ImageGenerationResponse interface
export interface ImageGenerationResponse {
  imageUrl: string;
  metadata: {
    title?: string;
    description?: string;
    date?: string;
    year?: number;
    location?: string;
    country?: string;
    gps?: GPSCoordinates;
    is_true_event?: boolean;
    is_ai_generated?: boolean;
    is_mature_content?: boolean;
    source?: string;
    accuracy_description?: number;
    accuracy_date?: number;
    accuracy_location?: number;
    accuracy_historical?: number;
    accuracy_realness?: number;
    accuracy_maturity?: number;
    address?: string; // Add address for compatibility
  };
  promptUsed?: string;
  error?: string;
  logs: string[];
}

// Define WriterPromptEntry interface
export interface WriterPromptEntry {
  id: string;
  prompt: string;
  response: string;
  created_at: string;
  title: string;
  description: string;
  short_description: string;
  detailed_description: string;
  year: number;
  date: string;
  address?: string;
  country: string;
  gps: GPSCoordinates;
  hints: { 
    hint_1: string; 
    hint_2: string; 
  };
  selected?: boolean; // Add selected flag for UI state
}

// Define WriterResponse interface
export interface WriterResponse {
  id: string;
  title: string;
  description: string;
  events: string[];
  created_at: string;
  entries: WriterPromptEntry[];
  status?: string; // Add status for error handling
  error?: string;  // Add error for error handling
}

// Add missing types for App Builder
export interface AppBuild {
  id: string;
  prompt: string;
  status: 'processing' | 'complete' | 'failed';
  timestamp: string;
  previewUrl?: string;
  exportUrl?: string;
  appName?: string;
  created_at?: string;
}

export interface AppBuildDB {
  id: string;
  prompt: string;
  status: string;
  timestamp: string;
  preview_url?: string;
  export_url?: string;
  app_name?: string;
  user_id?: string;
  code?: string;
  spec?: string;
  build_log?: any[];
}

export interface BuildWithLogs {
  id: string;
  prompt: string;
  status: string;
  timestamp: string;
  preview_url?: string;
  export_url?: string;
  app_name?: string;
  user_id?: string;
  code?: string;
  spec?: string;
  build_log: { step: string; status: string; message: string; timestamp: string; }[];
}

// Add missing types for image generation
export interface GPSCoordinates {
  lat: number;
  lng: number;
  lon?: number; // Add lon as optional for compatibility
}

export interface ImageGenerationRow {
  title: string;
  description: string;
  year: number;
  gps: GPSCoordinates;
  date?: string;
  address?: string;
  mature?: boolean;
  true_event?: boolean;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  metadata: {
    title?: string;
    description?: string;
    date?: string;
    year?: number;
    location?: string;
    country?: string;
    gps?: GPSCoordinates;
    is_true_event?: boolean;
    is_ai_generated?: boolean;
    is_mature_content?: boolean;
    source?: string;
    accuracy_description?: number;
    accuracy_date?: number;
    accuracy_location?: number;
    accuracy_historical?: number;
    accuracy_realness?: number;
    accuracy_maturity?: number;
    address?: string; // Add address for compatibility
  };
  promptUsed?: string;
  error?: string;
  logs: string[];
}

export interface WriterPromptEntry {
  id: string;
  prompt: string;
  response: string;
  created_at: string;
  title: string;
  description: string;
  short_description: string;
  detailed_description: string;
  year: number;
  date: string;
  address?: string;
  country: string;
  gps: GPSCoordinates;
  hints: { 
    hint_1: string; 
    hint_2: string; 
  };
  selected?: boolean; // Add selected flag for UI state
}

export interface WriterResponse {
  id: string;
  title: string;
  description: string;
  events: string[];
  created_at: string;
  entries: WriterPromptEntry[];
  status?: string; // Add status for error handling
  error?: string;  // Add error for error handling
}

// Command templates based on agent type
export const AGENT_COMMAND_TEMPLATES: Record<string, string[]> = {
  'Writer': [
    'Draft specification for new app',
    'Create blog post about AI ethics',
    'Write documentation for API endpoint',
    'Develop marketing copy for product launch'
  ],
  'Coder': [
    'Implement authentication flow',
    'Refactor database schema',
    'Create responsive UI component',
    'Write unit tests for core functions'
  ],
  'Researcher': [
    'Research market trends in AI',
    'Analyze competitor products',
    'Find relevant academic papers on topic',
    'Summarize latest developments in field'
  ],
  'Tester': [
    'Test user registration flow',
    'Validate API responses',
    'Check cross-browser compatibility',
    'Perform security analysis'
  ],
  'Finance': [
    'Calculate monthly cost projections',
    'Analyze cost trends by agent type',
    'Identify cost optimization opportunities',
    'Audit system spending by category'
  ],
  'Default': [
    'Analyze current system state',
    'Generate report on recent activities',
    'Process incoming data',
    'Optimize existing functionality'
  ]
};

// Zap app template for quicker agent creation
export const ZAP_SPEC_TEMPLATE = `
Create a no-code AI builder application called Zap with the following capabilities:
- Intuitive drag-and-drop interface for creating AI workflows
- Integration with popular AI models via API
- Component library for common AI tasks (text, image, audio processing)
- Templates for common use cases to get users started quickly
- Ability to deploy workflows as standalone applications
- User authentication and permission management
- Version control for workflows
`;

// Agent roles for dropdown selection
export const AGENT_ROLES = [
  'Writer',
  'Coder',
  'Researcher',
  'Tester',
  'Finance'
];

// Cost calculation constants
export const COST_CONSTANTS = {
  BASE_COST: 0.02,
  TOKEN_RATE: 0.000002,
  AVERAGE_TOKENS_PER_CHAR: 0.25
};

// App mission compliance criteria
export const MISSION_COMPLIANCE_KEYWORDS = {
  peace: ['peaceful', 'ethical', 'beneficial', 'sustainable', 'cooperative'],
  autonomy: ['autonomous', 'self-reliant', 'independent', 'automated', 'self-managing'],
  improvement: ['improve', 'enhance', 'optimize', 'learn', 'adapt', 'evolve']
};

// Agent chain definition
export const AGENT_CHAIN = [
  { role: 'Writer', description: 'Creates specifications and plans' },
  { role: 'Coder', description: 'Implements code based on specifications' },
  { role: 'Tester', description: 'Validates functionality and quality' },
  { role: 'Admin', description: 'Deploys and manages applications' }
];
