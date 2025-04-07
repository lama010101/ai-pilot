// Types representing Supabase database tables

export interface AgentTaskDB {
  id: string;
  agent_id: string;
  command: string;
  result: string;
  confidence: number;
  status: 'success' | 'failure' | 'processing';
  cost?: number; // Field for cost tracking
  parent_task_id?: string; // New field for agent-to-agent linking
  mission_score?: number; // New field for mission compliance
  timestamp: string;
}

export interface ActivityLogDB {
  id: string;
  agent_id: string;
  action: string;
  summary: string;
  status: string;
  timestamp: string;
}

export interface AgentDB {
  id: string;
  name: string;
  role: string;
  phase: number;
  is_ephemeral: boolean;
  last_updated: string;
}

export interface SystemStatusDB {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface AgentFeedbackDB {
  id: string;
  agent_id: string;
  task_id: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface CostLogDB {
  id: string;
  agent_id: string;
  task_id: string;
  cost: number;
  reason: string;
  timestamp: string;
}

export interface BudgetSettingsDB {
  monthly_limit: number;
  kill_threshold: number;
}

export interface AppSpecDB {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'in_progress' | 'completed' | 'deployed';
  content: string;
  author_id: string;
  created_at: string;
}

export interface TaskMemoryDB {
  id: string;
  task_id: string;
  prompt: string;
  result: string;
  timestamp: string;
}

// Define the ImageDB interface to match what's expected in the database
export interface ImageDB {
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
