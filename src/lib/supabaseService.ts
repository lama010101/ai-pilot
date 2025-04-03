
// This file is now a simple re-export of the supabase modules
// to maintain backward compatibility with existing code
import * as supabaseServices from './supabase';

// Re-export everything from the modules
export const {
  // Agent operations
  getAgents,
  getAgentById,
  createAgent,
  generateAgentFromSpec,
  
  // Task operations
  getAgentTasks,
  createAgentTask,
  injectZapWriterTask,
  spawnFollowUpAgents,
  getTasksForAppSpec,
  getAgentChain,
  
  // Activity log operations
  getActivityLogs,
  createActivityLog,
  
  // System status operations
  getSystemStatus,
  createSystemStatus,
  
  // Feedback operations
  getAgentFeedback,
  createAgentFeedback,
  
  // Cost operations
  getCostLogs,
  createCostLog,
  getBudgetSettings,
  updateBudgetSettings,
  getMonthlySpending,
  
  // App spec operations
  getAppSpecs,
  getAppSpecById,
  createAppSpec,
  updateAppSpec,
  deleteAppSpec,
  
  // Memory operations
  getTaskMemory,
  createTaskMemory,
  
  // Utils
  calculateTaskCost,
  calculateMissionScore,
  
  // Seed function
  seedInitialAgents
} = supabaseServices;
