
import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { ActivityLogDB } from '../supabaseTypes';
import { generateId } from './utils';

// Mock data for development mode
let mockActivityLogs: ActivityLogDB[] = [];

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
