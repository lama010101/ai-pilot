
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
