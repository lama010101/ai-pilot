
import { supabase, USE_FAKE_AUTH } from '../supabaseClient';
import { CostLogDB, BudgetSettingsDB } from '../supabaseTypes';
import { generateId } from './utils';
import { createSystemStatus } from './systemStatusService';

// Mock data for development mode
let mockCostLogs: CostLogDB[] = [];
let mockBudgetSettings: BudgetSettingsDB = {
  monthly_limit: 100,
  kill_threshold: 2
};

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
