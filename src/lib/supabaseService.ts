import { supabase, USE_FAKE_AUTH } from './supabaseClient';
import { 
  AgentDB, 
  AgentTaskDB, 
  ActivityLogDB, 
  SystemStatusDB, 
  AgentFeedbackDB,
  CostLogDB,
  BudgetSettingsDB,
  AppSpecDB,
  TaskMemoryDB,
  COST_CONSTANTS,
  MISSION_COMPLIANCE_KEYWORDS,
  ZAP_SPEC_TEMPLATE
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
let mockAppSpecs: AppSpecDB[] = [];
let mockTaskMemory: TaskMemoryDB[] = [];

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

// Calculate mission compliance score
export function calculateMissionScore(text: string): number {
  if (!text) return 0;
  
  const lowercaseText = text.toLowerCase();
  let score = 50; // Start at neutral
  
  // Check for peace keywords
  const peaceMatches = MISSION_COMPLIANCE_KEYWORDS.peace.filter(
    keyword => lowercaseText.includes(keyword)
  ).length;
  
  // Check for autonomy keywords
  const autonomyMatches = MISSION_COMPLIANCE_KEYWORDS.autonomy.filter(
    keyword => lowercaseText.includes(keyword)
  ).length;
  
  // Check for improvement keywords
  const improvementMatches = MISSION_COMPLIANCE_KEYWORDS.improvement.filter(
    keyword => lowercaseText.includes(keyword)
  ).length;
  
  // Calculate final score (each category can add up to ~16 points)
  score += peaceMatches * 5;
  score += autonomyMatches * 5;
  score += improvementMatches * 5;
  
  // Cap at 100
  return Math.min(Math.max(score, 0), 100);
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

export async function createAgentTask(agentTask: Omit<AgentTaskDB, 'id' | 'timestamp' | 'cost' | 'mission_score'>) {
  const cost = calculateTaskCost(agentTask.command);
  const missionScore = calculateMissionScore(agentTask.command);
  
  const newTask: AgentTaskDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    cost,
    mission_score: missionScore,
    ...agentTask,
  };
  
  if (USE_FAKE_AUTH) {
    mockAgentTasks.push(newTask);
    
    // Add to task memory
    await createTaskMemory({
      task_id: newTask.id,
      prompt: newTask.command,
      result: newTask.result
    });
    
    // If task is completed successfully, log the cost
    if (newTask.status === 'success') {
      await createCostLog({
        agent_id: newTask.agent_id,
        task_id: newTask.id,
        cost: newTask.cost || 0,
        reason: 'task completed'
      });
      
      // Check if this is a spec creation task
      if (newTask.agent_id === 'zapwriter' && 
          newTask.command.toLowerCase().includes('spec') &&
          newTask.status === 'success') {
        // Create app spec from task result
        await createAppSpec({
          name: 'Zap',
          description: 'No-code AI webapp builder',
          status: 'draft',
          content: newTask.result,
          author_id: newTask.agent_id
        });
        
        // Auto-spawn follow-up agents
        await spawnFollowUpAgents(newTask.id);
      }
    }
    
    return { data: newTask, error: null };
  }
  
  const result = await supabase
    .from('agent_tasks')
    .insert(newTask)
    .select()
    .single();
    
  if (result.data) {
    // Add to task memory
    await createTaskMemory({
      task_id: result.data.id,
      prompt: result.data.command,
      result: result.data.result
    });
    
    // If task is completed successfully, log the cost
    if (result.data.status === 'success') {
      await createCostLog({
        agent_id: result.data.agent_id,
        task_id: result.data.id,
        cost: result.data.cost || 0,
        reason: 'task completed'
      });
      
      // Check if this is a spec creation task
      if (result.data.agent_id === 'zapwriter' && 
          result.data.command.toLowerCase().includes('spec') &&
          result.data.status === 'success') {
        // Create app spec from task result
        await createAppSpec({
          name: 'Zap',
          description: 'No-code AI webapp builder',
          status: 'draft',
          content: result.data.result,
          author_id: result.data.agent_id
        });
        
        // Auto-spawn follow-up agents
        await spawnFollowUpAgents(result.data.id);
      }
    }
  }
    
  return result;
}

// Auto-inject ZapWriter task if none exists
export async function injectZapWriterTask() {
  const { data: tasks } = await getAgentTasks('zapwriter');
  
  if (!tasks || tasks.length === 0) {
    await createAgentTask({
      agent_id: 'zapwriter',
      command: "Write a full app spec for Zap: a no-code AI webapp builder aligned with the AI Pilot mission.",
      result: "",
      confidence: 0.9,
      status: 'processing'
    });
    
    await createActivityLog({
      agent_id: 'zapwriter',
      action: 'task_created',
      summary: 'Auto-injected Zap spec creation task',
      status: 'success'
    });
  }
}

// Auto-spawn follow-up agents for the chain
export async function spawnFollowUpAgents(parentTaskId: string) {
  // Get the parent task
  const { data: parentTask } = USE_FAKE_AUTH 
    ? { data: mockAgentTasks.find(t => t.id === parentTaskId), error: null }
    : await supabase.from('agent_tasks').select('*').eq('id', parentTaskId).single();
  
  if (!parentTask) return;
  
  // Get the app spec
  const { data: appSpecs } = await getAppSpecs();
  const appSpec = appSpecs?.[0]; // Just use the first one for now
  
  if (!appSpec) return;
  
  // Create Builder agent if needed
  const builderId = `builder-${generateId().substring(0, 6)}`;
  await createAgent({
    name: 'Zap Builder',
    role: 'Coder',
    phase: 1,
    is_ephemeral: false,
    id: builderId // Temporarily add id here
  } as any); // Use 'as any' to bypass the type checking for this special case
  
  // Assign task to builder
  await createAgentTask({
    agent_id: builderId,
    command: `Build full frontend + backend for the app described in this spec: ${appSpec.name}\n\n${appSpec.content.substring(0, 500)}...`,
    result: "",
    confidence: 0.8,
    status: 'processing',
    parent_task_id: parentTaskId
  });
  
  // Create Tester agent
  const testerId = `tester-${generateId().substring(0, 6)}`;
  await createAgent({
    name: 'Zap Tester',
    role: 'Tester',
    phase: 1,
    is_ephemeral: true,
    id: testerId // Temporarily add id here
  } as any); // Use 'as any' to bypass the type checking for this special case
  
  // Assign task to tester
  await createAgentTask({
    agent_id: testerId,
    command: `Run tests on the app built from spec: ${appSpec.name}`,
    result: "",
    confidence: 0.7,
    status: 'processing',
    parent_task_id: parentTaskId
  });
  
  // Create Admin agent
  const adminId = `admin-${generateId().substring(0, 6)}`;
  await createAgent({
    name: 'Zap Admin',
    role: 'Admin',
    phase: 1,
    is_ephemeral: false,
    id: adminId // Temporarily add id here
  } as any); // Use 'as any' to bypass the type checking for this special case
  
  // Assign task to admin
  await createAgentTask({
    agent_id: adminId,
    command: `Deploy the app built from spec: ${appSpec.name} to Vercel`,
    result: "",
    confidence: 0.6,
    status: 'processing',
    parent_task_id: parentTaskId
  });
  
  // Update app spec status
  await updateAppSpec(appSpec.id, {
    ...appSpec,
    status: 'in_progress'
  });
  
  await createActivityLog({
    agent_id: parentTask.agent_id,
    action: 'agents_spawned',
    summary: 'Auto-spawned Builder, Tester, and Admin agents for Zap app',
    status: 'success'
  });
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
      }
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
    }
  };
}

// App specs operations
export async function getAppSpecs() {
  if (USE_FAKE_AUTH) {
    return { 
      data: mockAppSpecs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), 
      error: null 
    };
  }
  
  return await supabase
    .from('app_specs')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function getAppSpecById(id: string) {
  if (USE_FAKE_AUTH) {
    const spec = mockAppSpecs.find(s => s.id === id);
    return { data: spec || null, error: spec ? null : new Error('App spec not found') };
  }
  
  return await supabase
    .from('app_specs')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createAppSpec(spec: Omit<AppSpecDB, 'id' | 'created_at'>) {
  const newSpec: AppSpecDB = {
    id: generateId(),
    created_at: new Date().toISOString(),
    ...spec,
  };
  
  if (USE_FAKE_AUTH) {
    mockAppSpecs.push(newSpec);
    
    await createActivityLog({
      agent_id: newSpec.author_id,
      action: 'spec_created',
      summary: `Created app spec: ${newSpec.name}`,
      status: 'success'
    });
    
    return { data: newSpec, error: null };
  }
  
  const result = await supabase
    .from('app_specs')
    .insert(newSpec)
    .select()
    .single();
    
  if (result.data) {
    await createActivityLog({
      agent_id: result.data.author_id,
      action: 'spec_created',
      summary: `Created app spec: ${result.data.name}`,
      status: 'success'
    });
  }
    
  return result;
}

export async function updateAppSpec(id: string, spec: Omit<AppSpecDB, 'id' | 'created_at'>) {
  if (USE_FAKE_AUTH) {
    const index = mockAppSpecs.findIndex(s => s.id === id);
    if (index === -1) {
      return { data: null, error: new Error('App spec not found') };
    }
    
    mockAppSpecs[index] = { ...mockAppSpecs[index], ...spec };
    
    await createActivityLog({
      agent_id: spec.author_id,
      action: 'spec_updated',
      summary: `Updated app spec: ${spec.name}`,
      status: 'success'
    });
    
    return { data: mockAppSpecs[index], error: null };
  }
  
  const result = await supabase
    .from('app_specs')
    .update(spec)
    .eq('id', id)
    .select()
    .single();
    
  if (result.data) {
    await createActivityLog({
      agent_id: result.data.author_id,
      action: 'spec_updated',
      summary: `Updated app spec: ${result.data.name}`,
      status: 'success'
    });
  }
    
  return result;
}

export async function deleteAppSpec(id: string) {
  if (USE_FAKE_AUTH) {
    const index = mockAppSpecs.findIndex(s => s.id === id);
    if (index === -1) {
      return { data: null, error: new Error('App spec not found') };
    }
    
    const deleted = mockAppSpecs[index];
    mockAppSpecs.splice(index, 1);
    
    await createActivityLog({
      agent_id: deleted.author_id,
      action: 'spec_deleted',
      summary: `Deleted app spec: ${deleted.name}`,
      status: 'success'
    });
    
    return { data: deleted, error: null };
  }
  
  const { data: spec } = await getAppSpecById(id);
  
  const result = await supabase
    .from('app_specs')
    .delete()
    .eq('id', id)
    .select()
    .single();
    
  if (spec) {
    await createActivityLog({
      agent_id: spec.author_id,
      action: 'spec_deleted',
      summary: `Deleted app spec: ${spec.name}`,
      status: 'success'
    });
  }
    
  return result;
}

// Task memory operations
export async function getTaskMemory(taskId: string) {
  if (USE_FAKE_AUTH) {
    const memory = mockTaskMemory.filter(m => m.task_id === taskId);
    return { 
      data: memory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
      error: null 
    };
  }
  
  return await supabase
    .from('task_memory')
    .select('*')
    .eq('task_id', taskId)
    .order('timestamp', { ascending: false });
}

export async function createTaskMemory(memory: Omit<TaskMemoryDB, 'id' | 'timestamp'>) {
  const newMemory: TaskMemoryDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...memory,
  };
  
  if (USE_FAKE_AUTH) {
    mockTaskMemory.push(newMemory);
    return { data: newMemory, error: null };
  }
  
  return await supabase
    .from('task_memory')
    .insert(newMemory)
    .select()
    .single();
}

// Get tasks for app spec based on agent chain
export async function getTasksForAppSpec(specId: string) {
  // In a real implementation, this would get all tasks related to an app spec
  // For now, we'll just return all tasks
  if (USE_FAKE_AUTH) {
    return { data: mockAgentTasks, error: null };
  }
  
  return await supabase
    .from('agent_tasks')
    .select('*')
    .order('timestamp', { ascending: false });
}

// Get agent chain for app spec
export async function getAgentChain(parentTaskId: string) {
  if (USE_FAKE_AUTH) {
    // Get the parent task
    const parent = mockAgentTasks.find(t => t.id === parentTaskId);
    if (!parent) return { data: [], error: new Error('Parent task not found') };
    
    // Get all child tasks
    const children = mockAgentTasks.filter(t => t.parent_task_id === parentTaskId);
    
    // Combine parent and children
    const chain = [parent, ...children];
    
    return { data: chain, error: null };
  }
  
  // Get the parent task
  const { data: parent } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', parentTaskId)
    .single();
    
  if (!parent) return { data: [], error: new Error('Parent task not found') };
  
  // Get all child tasks
  const { data: children } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('parent_task_id', parentTaskId);
    
  // Combine parent and children
  const chain = [parent, ...(children || [])];
  
  return { data: chain, error: null };
}

// Seed initial data
export async function seedInitialAgents() {
  if (USE_FAKE_AUTH) {
    // Ensure ZapWriter exists
    if (!mockAgentsDB.some(agent => agent.id === 'zapwriter')) {
      mockAgentsDB.push(zapWriterAgent);
    }
    
    // Auto-inject ZapWriter task
    await injectZapWriterTask();
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
  
  // Ensure ZapWriter exists
  const { data: zapWriter } = await getAgentById('zapwriter');
  if (!zapWriter) {
    await supabase.from('agents').insert(zapWriterAgent);
  }
  
  // Auto-inject ZapWriter task
  await injectZapWriterTask();
}
