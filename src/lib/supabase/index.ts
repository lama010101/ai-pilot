
// Export all services
export * from './agentService';
export * from './taskService';
export * from './activityLogService';
export * from './systemStatusService';
export * from './feedbackService';
export * from './costService';
export * from './appSpecService';
export * from './memoryService';
export * from './utils';

// Initialization function
import { getAgentById } from './agentService';
import { injectZapWriterTask } from './taskService';

export async function seedInitialAgents() {
  // Ensure ZapWriter exists
  const { data: zapWriter } = await getAgentById('zapwriter');
  if (!zapWriter) {
    console.log("ZapWriter not found, it should be created by agentService initialization");
  }
  
  // Auto-inject ZapWriter task
  await injectZapWriterTask();
}
