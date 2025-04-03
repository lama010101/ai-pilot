
import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { AppSpecDB } from '../supabaseTypes';
import { generateId } from './utils';
import { createActivityLog } from './activityLogService';

// Mock data for development mode
let mockAppSpecs: AppSpecDB[] = [];

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
