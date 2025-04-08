import { Json } from '@/integrations/supabase/types';

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
  image_mobile_url?: string;
  image_tablet_url?: string;
  image_desktop_url?: string;
  source_name?: string;
  source_app?: string;
  prompt?: string;
  ai_description?: string;
  confidence_score?: number;
  tag?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

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

export interface ImageDataDB {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
}

export interface GPSCoordinates {
  lat: number;
  lng: number;
  lon?: number;
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
    address?: string;
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
  selected?: boolean;
}

export interface WriterResponse {
  id: string;
  title: string;
  description: string;
  events: string[];
  created_at: string;
  entries: WriterPromptEntry[];
  status?: string;
  error?: string;
}

export interface AppBuild {
  id: string;
  prompt: string;
  status: 'processing' | 'complete' | 'failed';
  timestamp: string;
  previewUrl?: string;
  exportUrl?: string;
  productionUrl?: string;
  appName: string;
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

export interface AgentSpec {
  id: string;
  title: string;
  description: string;
  agent_type: string;
  status: 'active' | 'inactive' | 'pending';
  prompt_template?: string;
  system_prompt?: string;
  icon?: string;
  template_id?: string;
  created_at: string;
}

export interface AgentSpawnerTemplate {
  id: string;
  title: string;
  description: string;
  agent_type: string;
  prompt_template: string;
  system_prompt: string;
  icon?: string;
  template_id?: string;
  parent_agent_id?: string;
}

export interface AgentTask {
  id: string;
  agent_id: string;
  task_type: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  input: string;
  output?: string;
  error?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  cost?: number;
  tokens?: number;
  parent_task_id?: string;
}

export interface AchainTask {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  result: any;
  tasks: TaskNode[];
}

export interface TaskNode {
  id: string;
  agent_id: string;
  task_type: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  input: string;
  output?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  children?: TaskNode[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'pending';
  capabilities: string[];
  icon?: string;
  created_at: string;
  last_active?: string;
  metadata?: Record<string, any>;
  tasks_completed: number;
  task_success_rate: number;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data?: Record<string, any>;
  timestamp: string;
}

export interface AgentFeedback {
  id: string;
  agent_id: string;
  task_id: string;
  user_id: string;
  rating: number;
  feedback_text?: string;
  created_at: string;
}

export interface SystemStatus {
  id: string;
  system_state: 'operational' | 'degraded' | 'maintenance' | 'offline';
  message?: string;
  last_updated: string;
}

export interface CostLog {
  id: string;
  agent_id?: string;
  task_id?: string;
  cost_type: string;
  cost_amount: number;
  token_count?: number;
  timestamp: string;
}

export interface BudgetSettings {
  id: string;
  monthly_budget: number;
  alert_threshold: number;
  auto_disable: boolean;
  last_updated: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_from_user: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AppSpec {
  id: string;
  title: string;
  description: string;
  features: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_id: string;
  tasks?: AgentTask[];
}

export interface TaskMemory {
  id: string;
  task_id: string;
  memory_type: string;
  memory_data: Record<string, any>;
  created_at: string;
}

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

export const AGENT_ROLES = [
  'Writer',
  'Coder',
  'Researcher',
  'Tester',
  'Finance'
];

export const COST_CONSTANTS = {
  BASE_COST: 0.02,
  TOKEN_RATE: 0.000002,
  AVERAGE_TOKENS_PER_CHAR: 0.25
};

export const MISSION_COMPLIANCE_KEYWORDS = {
  peace: ['peaceful', 'ethical', 'beneficial', 'sustainable', 'cooperative'],
  autonomy: ['autonomous', 'self-reliant', 'independent', 'automated', 'self-managing'],
  improvement: ['improve', 'enhance', 'optimize', 'learn', 'adapt', 'evolve']
};

export const AGENT_CHAIN = [
  { role: 'Writer', description: 'Creates specifications and plans' },
  { role: 'Coder', description: 'Implements code based on specifications' },
  { role: 'Tester', description: 'Validates functionality and quality' },
  { role: 'Admin', description: 'Deploys and manages applications' }
];
