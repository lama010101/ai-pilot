
import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { SystemStatusDB } from '../supabaseTypes';
import { generateId } from './utils';

// Mock data for development mode
let mockSystemStatus: SystemStatusDB[] = [
  {
    id: '1',
    type: 'system',
    message: 'All systems operational',
    severity: 'info',
    timestamp: new Date().toISOString()
  }
];

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
