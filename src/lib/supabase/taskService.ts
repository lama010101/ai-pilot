
import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { AgentTaskDB } from '../supabaseTypes';
import { generateId, calculateTaskCost, calculateMissionScore } from './utils';
import { createCostLog } from './costService';
import { createTaskMemory } from './memoryService';
import { createAppSpec, updateAppSpec } from './appSpecService';
import { createActivityLog } from './activityLogService';
import { createAgent } from './agentService';

// Mock data for development mode
let mockAgentTasks: AgentTaskDB[] = [];

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
      command: "Write a complete app spec for Zap: a no-code AI webapp builder that builds apps using other AIs. Follow the peace mission and v0.6 Dashboard format.",
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
    
    return { success: true, message: "ZapWriter task injected successfully" };
  }
  
  return { success: false, message: "ZapWriter tasks already exist" };
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
    if (!parent) return { data: [], error: null }; // Fixed: Changed from Error to null to match return type
    
    // Get all child tasks
    const children = mockAgentTasks.filter(t => t.parent_task_id === parentTaskId);
    
    // Combine parent and children
    const chain = [parent, ...children];
    
    return { data: chain, error: null };
  }
  
  // Get the parent task
  const { data: parent, error: parentError } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', parentTaskId)
    .single();
    
  if (parentError || !parent) return { data: [], error: null }; // Fixed: Changed from Error to null to match return type
  
  // Get all child tasks
  const { data: children } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('parent_task_id', parentTaskId);
    
  // Combine parent and children
  const chain = [parent, ...(children || [])];
  
  return { data: chain, error: null };
}

// This is an import function referenced inside this file
import { getAppSpecs } from './appSpecService';
