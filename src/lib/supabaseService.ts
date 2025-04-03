
import { supabase, USE_FAKE_AUTH } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { AgentDB, AgentTaskDB, ActivityLogDB } from './supabaseTypes';
import { agents as mockAgents } from '@/data/agents';

// Mock data for development mode
let mockAgentTasks: AgentTaskDB[] = [];
let mockActivityLogs: ActivityLogDB[] = [];
let mockAgentsDB: AgentDB[] = mockAgents.map(agent => ({
  id: agent.id,
  name: agent.name,
  role: agent.description || 'General AI Assistant',
  phase: 1,
  is_ephemeral: false,
  last_updated: new Date().toISOString(),
}));

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
    id: uuidv4(),
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
export async function getActivityLogs(limit = 10) {
  if (USE_FAKE_AUTH) {
    return { 
      data: mockActivityLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit), 
      error: null 
    };
  }
  
  return await supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
}

export async function createActivityLog(log: Omit<ActivityLogDB, 'id' | 'timestamp'>) {
  const newLog: ActivityLogDB = {
    id: uuidv4(),
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
