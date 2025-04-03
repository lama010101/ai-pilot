
import { supabase, USE_FAKE_AUTH } from './supabaseClient';
import { 
  AgentDB, 
  AgentTaskDB, 
  ActivityLogDB, 
  SystemStatusDB, 
  AgentFeedbackDB,
  CostLogDB,
  BudgetSettingsDB,
  COST_CONSTANTS
} from './supabaseTypes';
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
let mockCostLogs: CostLogDB[] = [];
let mockBudgetSettings: BudgetSettingsDB = {
  monthly_limit: 100,
  kill_threshold: 2
};

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

// Generate a unique ID
function generateId(): string {
  // Simple UUID-like generation for mock data
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Calculate cost for a task
export function calculateTaskCost(command: string): number {
  // Simple cost calculation based on input length
  const { BASE_COST, TOKEN_RATE, AVERAGE_TOKENS_PER_CHAR } = COST_CONSTANTS;
  const estimatedTokens = command.length * AVERAGE_TOKENS_PER_CHAR;
  return BASE_COST + (estimatedTokens * TOKEN_RATE);
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

export async function createAgentTask(agentTask: Omit<AgentTaskDB, 'id' | 'timestamp' | 'cost'>) {
  const cost = calculateTaskCost(agentTask.command);
  
  const newTask: AgentTaskDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    cost,
    ...agentTask,
  };
  
  if (USE_FAKE_AUTH) {
    mockAgentTasks.push(newTask);
    
    // If task is completed successfully, log the cost
    if (newTask.status === 'success') {
      await createCostLog({
        agent_id: newTask.agent_id,
        task_id: newTask.id,
        cost: newTask.cost || 0,
        reason: 'task completed'
      });
    }
    
    return { data: newTask, error: null };
  }
  
  const result = await supabase
    .from('agent_tasks')
    .insert(newTask)
    .select()
    .single();
    
  // If task is completed successfully, log the cost
  if (result.data && result.data.status === 'success') {
    await createCostLog({
      agent_id: result.data.agent_id,
      task_id: result.data.id,
      cost: result.data.cost || 0,
      reason: 'task completed'
    });
  }
    
  return result;
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

// Cost logs operations
export async function getCostLogs(limit = 100) {
  if (USE_FAKE_AUTH) {
    return { 
      data: mockCostLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit), 
      error: null 
    };
  }
  
  return await supabase
    .from('cost_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
}

export async function createCostLog(log: Omit<CostLogDB, 'id' | 'timestamp'>) {
  const newLog: CostLogDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...log,
  };
  
  if (USE_FAKE_AUTH) {
    mockCostLogs.push(newLog);
    return { data: newLog, error: null };
  }
  
  return await supabase
    .from('cost_logs')
    .insert(newLog)
    .select()
    .single();
}

// Budget operations
export async function getBudgetSettings() {
  if (USE_FAKE_AUTH) {
    return { data: mockBudgetSettings, error: null };
  }
  
  // In a real implementation, this would fetch from a settings table
  const { data } = await supabase
    .from('system_status')
    .select('*')
    .eq('type', 'budget')
    .order('timestamp', { ascending: false })
    .limit(1);
    
  if (data && data.length > 0) {
    try {
      // Parse the budget settings from the message field
      return { data: JSON.parse(data[0].message), error: null };
    } catch (e) {
      return { 
        data: { monthly_limit: 100, kill_threshold: 2 }, 
        error: new Error('Failed to parse budget settings') 
      };
    }
  }
  
  return { 
    data: { monthly_limit: 100, kill_threshold: 2 }, 
    error: null 
  };
}

export async function updateBudgetSettings(settings: BudgetSettingsDB) {
  if (USE_FAKE_AUTH) {
    mockBudgetSettings = settings;
    return { data: settings, error: null };
  }
  
  // In a real implementation, this would update a settings table
  return await createSystemStatus({
    type: 'budget',
    message: JSON.stringify(settings),
    severity: 'info'
  });
}

// Get monthly spending
export async function getMonthlySpending() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  if (USE_FAKE_AUTH) {
    const thisMonth = mockCostLogs.filter(log => 
      new Date(log.timestamp) >= startOfMonth
    );
    
    const totalSpend = thisMonth.reduce((sum, log) => sum + log.cost, 0);
    
    return { data: totalSpend, error: null };
  }
  
  // In a real implementation, this would use a database query to sum the costs
  const { data, error } = await supabase
    .from('cost_logs')
    .select('cost')
    .gte('timestamp', startOfMonth.toISOString());
    
  if (error) {
    return { data: 0, error };
  }
  
  const totalSpend = data.reduce((sum, log) => sum + log.cost, 0);
  
  return { data: totalSpend, error: null };
}

// Mock LLM call to generate agent from spec
export async function generateAgentFromSpec(spec: string) {
  // This is a mock function that would normally call an API
  const isZapSpec = spec.toLowerCase().includes('zap') || 
                    spec.toLowerCase().includes('no-code') ||
                    spec.toLowerCase().includes('builder');
  
  if (isZapSpec) {
    return {
      data: {
        name: 'ZapWriter',
        role: 'Writer',
        is_ephemeral: false,
        phase: 1,
        initialTask: "Write full spec for Zap based on mission"
      },
      error: null
    };
  }
  
  // For other specs, generate a random agent config
  const roles = ['Writer', 'Coder', 'Researcher', 'Tester'];
  const randomRole = roles[Math.floor(Math.random() * roles.length)];
  const randomName = `${randomRole}${Math.floor(Math.random() * 1000)}`;
  
  return {
    data: {
      name: randomName,
      role: randomRole,
      is_ephemeral: Math.random() > 0.5, // 50% chance of being ephemeral
      phase: 1,
      initialTask: `Process the following specification: ${spec.substring(0, 30)}...`
    },
    error: null
  };
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
  
  // Ensure Finance AI exists
  const { data: financeAi } = await getAgentById('finance-ai');
  if (!financeAi) {
    await supabase.from('agents').insert(financeAgent);
  }
}
