
export type AgentStatus = 'idle' | 'running' | 'error';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  lastActive: string;
  description?: string;
  currentTask?: string;
}

export const agents: Agent[] = [
  { 
    id: 'writer', 
    name: 'AI Writer', 
    status: 'idle', 
    lastActive: 'Just now',
    description: 'Responsible for drafting specifications, documentation, and user-facing content',
    currentTask: 'Drafting technical spec'
  },
  { 
    id: 'coder', 
    name: 'AI Coder', 
    status: 'running', 
    lastActive: '1 min ago',
    description: 'Generates code based on specifications and requirements',
    currentTask: 'Building authentication module'
  },
  { 
    id: 'tester', 
    name: 'AI Tester', 
    status: 'idle', 
    lastActive: '3 mins ago',
    description: 'Runs tests, quality checks, and code reviews',
    currentTask: 'Waiting for code to test'
  },
  { 
    id: 'image-agent', 
    name: 'Image Agent', 
    status: 'idle', 
    lastActive: '5 mins ago',
    description: 'Extracts metadata from images using OCR + AI',
    currentTask: 'Processing uploaded images'
  },
];

export interface ActivityLog {
  id: string;
  agentId: string;
  timestamp: string;
  message: string;
}

export const activityLogs: ActivityLog[] = [
  { id: '1', agentId: 'writer', timestamp: 'Just now', message: 'AI Writer updated project spec' },
  { id: '2', agentId: 'coder', timestamp: '1 min ago', message: 'AI Coder generated file /components/Auth.tsx' },
  { id: '3', agentId: 'tester', timestamp: '3 mins ago', message: 'AI Tester completed code review' },
  { id: '4', agentId: 'image-agent', timestamp: '5 mins ago', message: 'Image Agent processed 8 images' },
];
