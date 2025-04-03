
import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { TaskMemoryDB } from '../supabaseTypes';
import { generateId } from './utils';

// Mock data for development mode
let mockTaskMemory: TaskMemoryDB[] = [];

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
