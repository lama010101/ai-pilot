
// Types representing Supabase database tables

export interface AgentTaskDB {
  id: string;
  agent_id: string;
  command: string;
  result: string;
  confidence: number;
  status: 'success' | 'failure' | 'processing';
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
  'Default': [
    'Analyze current system state',
    'Generate report on recent activities',
    'Process incoming data',
    'Optimize existing functionality'
  ]
};
