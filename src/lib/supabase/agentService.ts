import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { AgentDB } from '../supabaseTypes';
import { agents as mockAgents } from '@/data/agents';
import { generateId } from './utils';
import { createActivityLog } from './activityLogService';

// Mock data for development mode
let mockAgentsDB: AgentDB[] = mockAgents.map(agent => ({
  id: agent.id,
  name: agent.name,
  role: agent.description || 'General AI Assistant',
  phase: 1,
  is_ephemeral: false,
  last_updated: new Date().toISOString(),
}));

// Add Finance AI agent if it doesn't exist
const financeAgent: AgentDB = {
  id: 'finance-ai',
  name: 'Finance AI',
  role: 'Finance',
  phase: 1,
  is_ephemeral: false,
  last_updated: new Date().toISOString()
};

if (!mockAgentsDB.some(agent => agent.id === 'finance-ai')) {
  mockAgentsDB.push(financeAgent);
}

// Ensure ZapWriter exists
const zapWriterAgent: AgentDB = {
  id: 'zapwriter',
  name: 'ZapWriter',
  role: 'Writer',
  phase: 1,
  is_ephemeral: false,
  last_updated: new Date().toISOString()
};

if (!mockAgentsDB.some(agent => agent.id === 'zapwriter')) {
  mockAgentsDB.push(zapWriterAgent);
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

// Update the generateAgentFromSpec function to return the correct type
export async function generateAgentFromSpec(spec: string) {
  // This is a mock implementation. In a real app, this would call an API or use AI
  // to generate agent configuration based on the spec.
  
  // If the spec mentions Zap, assume it's a Zap-specific agent
  if (spec.includes("Zap")) {
    return {
      data: {
        name: "ZapSpecialist",
        role: "Writer",
        is_ephemeral: false,
        phase: 1,
        initialTask: "Write full spec for Zap based on mission"
      },
      error: null
    };
  }
  
  // Otherwise, generate a generic agent based on the spec
  return {
    data: {
      name: `Agent${Math.floor(Math.random() * 1000)}`,
      role: ["Writer", "Coder", "Tester", "Admin"][Math.floor(Math.random() * 4)],
      is_ephemeral: Math.random() > 0.5, // 50% chance of being ephemeral
      phase: 1,
      initialTask: `Process the following specification: ${spec.substring(0, 30)}...`
    },
    error: null
  };
}
