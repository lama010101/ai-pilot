
// Types representing Supabase database tables

export interface AgentTaskDB {
  id: string;
  agent_id: string;
  command: string;
  result: string;
  confidence: number;
  status: 'success' | 'failure' | 'processing';
  cost?: number; // New field for cost tracking
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
