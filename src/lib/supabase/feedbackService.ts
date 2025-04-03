
import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { AgentFeedbackDB } from '../supabaseTypes';
import { generateId } from './utils';

// Mock data for development mode
let mockAgentFeedback: AgentFeedbackDB[] = [];

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
