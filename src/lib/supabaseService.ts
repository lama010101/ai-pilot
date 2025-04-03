
import { supabase, USE_FAKE_AUTH } from './supabaseClient';
import { AgentDB, AgentTaskDB, ActivityLogDB, SystemStatusDB, AgentFeedbackDB } from './supabaseTypes';
import { agents as mockAgents } from '@/data/agents';

// Mock data for development mode
let mockAgentTasks: AgentTaskDB[] = [];
let mockActivityLogs: ActivityLogDB[] = [];
let mockSystemStatus: SystemStatusDB[] = [
  {
    id: '1',
    type: 'system',
    message: 'All systems operational',
    severity: 'info',
    timestamp: new Date().toISOString()
  }
];
let mockAgentFeedback: AgentFeedbackDB[] = [];
let mockAgentsDB: AgentDB[] = mockAgents.map(agent => ({
  id: agent.id,
  name: agent.name,
  role: agent.description || 'General AI Assistant',
  phase: 1,
  is_ephemeral: false,
  last_updated: new Date().toISOString(),
}));

// Generate a unique ID
function generateId(): string {
  // Simple UUID-like generation for mock data
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Agent operations
export async function getAgents() {
  if (USE_FAKE_AUTH) {
    return { data: mockAgentsDB, error: null };
  }
  
  return await supabase
    .from('agents')
    .select('*')
    .order('name');
}

export async function getAgentById(id: string) {
  if (USE_FAKE_AUTH) {
    const agent = mockAgentsDB.find(a => a.id === id);
    return { data: agent || null, error: agent ? null : new Error('Agent not found') };
  }
  
  return await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createAgent(agent: Omit<AgentDB, 'id' | 'last_updated'>) {
  const newAgent: AgentDB = {
    id: generateId(),
    last_updated: new Date().toISOString(),
    ...agent
  };

  if (USE_FAKE_AUTH) {
    mockAgentsDB.push(newAgent);
    return { data: newAgent, error: null };
  }
  
  return await supabase
    .from('agents')
    .insert(newAgent)
    .select()
    .single();
}

// Agent Tasks operations
export async function getAgentTasks(agentId: string) {
  if (USE_FAKE_AUTH) {
    const tasks = mockAgentTasks.filter(task => task.agent_id === agentId);
    return { data: tasks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), error: null };
  }
  
  return await supabase
    .from('agent_tasks')
    .select('*')
    .eq('agent_id', agentId)
    .order('timestamp', { ascending: false });
}

export async function createAgentTask(agentTask: Omit<AgentTaskDB, 'id' | 'timestamp'>) {
  const newTask: AgentTaskDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...agentTask,
  };
  
  if (USE_FAKE_AUTH) {
    mockAgentTasks.push(newTask);
    return { data: newTask, error: null };
  }
  
  return await supabase
    .from('agent_tasks')
    .insert(newTask)
    .select()
    .single();
}

// Activity logs operations
export async function getActivityLogs(limit = 10, agentType?: string, status?: string) {
  if (USE_FAKE_AUTH) {
    let logs = [...mockActivityLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Filter by status if provided
    if (status) {
      logs = logs.filter(log => log.status === status);
    }
    
    // We don't have agent type in the mock logs, so we'd need to join with agents
    // In a real implementation, this would filter by agent type
    
    return { data: logs.slice(0, limit), error: null };
  }
  
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false });
    
  if (status) {
    query = query.eq('status', status);
  }
  
  // In a real implementation, if agentType is provided, we'd need a join
  // or a subquery to filter by agent type
  
  return await query.limit(limit);
}

export async function createActivityLog(log: Omit<ActivityLogDB, 'id' | 'timestamp'>) {
  const newLog: ActivityLogDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...log,
  };
  
  if (USE_FAKE_AUTH) {
    mockActivityLogs.push(newLog);
    return { data: newLog, error: null };
  }
  
  return await supabase
    .from('activity_logs')
    .insert(newLog)
    .select()
    .single();
}

// System status operations
export async function getSystemStatus() {
  if (USE_FAKE_AUTH) {
    return { 
      data: mockSystemStatus.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      error: null 
    };
  }
  
  return await supabase
    .from('system_status')
    .select('*')
    .order('timestamp', { ascending: false });
}

export async function createSystemStatus(status: Omit<SystemStatusDB, 'id' | 'timestamp'>) {
  const newStatus: SystemStatusDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...status,
  };
  
  if (USE_FAKE_AUTH) {
    mockSystemStatus.push(newStatus);
    return { data: newStatus, error: null };
  }
  
  return await supabase
    .from('system_status')
    .insert(newStatus)
    .select()
    .single();
}

// Agent Feedback operations
export async function getAgentFeedback(agentId: string) {
  if (USE_FAKE_AUTH) {
    const feedback = mockAgentFeedback.filter(f => f.agent_id === agentId);
    return { 
      data: feedback.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
      error: null 
    };
  }
  
  return await supabase
    .from('agent_feedback')
    .select('*')
    .eq('agent_id', agentId)
    .order('timestamp', { ascending: false });
}

export async function createAgentFeedback(feedback: Omit<AgentFeedbackDB, 'id' | 'timestamp'>) {
  const newFeedback: AgentFeedbackDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...feedback,
  };
  
  if (USE_FAKE_AUTH) {
    mockAgentFeedback.push(newFeedback);
    return { data: newFeedback, error: null };
  }
  
  return await supabase
    .from('agent_feedback')
    .insert(newFeedback)
    .select()
    .single();
}

// Seed initial data
export async function seedInitialAgents() {
  if (USE_FAKE_AUTH) {
    return;
  }
  
  const { data: existingAgents } = await getAgents();
  
  if (!existingAgents || existingAgents.length === 0) {
    const initialAgents: Omit<AgentDB, 'id'>[] = mockAgents.map(agent => ({
      name: agent.name,
      role: agent.description || 'General AI Assistant',
      phase: 1,
      is_ephemeral: false,
      last_updated: new Date().toISOString(),
    }));
    
    for (const agent of initialAgents) {
      await supabase.from('agents').insert({ id: mockAgents.find(a => a.name === agent.name)?.id, ...agent });
    }
  }
}
