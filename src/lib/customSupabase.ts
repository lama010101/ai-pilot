
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskLog } from '@/components/task-manager/taskTypes';

// Custom wrapper for type-safe Supabase operations on tasks and task logs
export const tasksClient = {
  // Task operations
  getTasks: (projectId: string) => 
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId) as unknown as Promise<{ data: Task[] | null, error: any }>,
  
  createTask: (task: Omit<Task, 'id'> & { id: string }) => 
    supabase
      .from('tasks')
      .insert({
        id: task.id,
        project_id: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
        prd_link: task.prdLink,
        verification_criteria: task.verificationCriteria,
        execution_count: task.executionCount || 0,
        assigned_agent: task.assignedAgent,
        last_run_at: task.lastRunAt
      }) as unknown as Promise<{ data: any, error: any }>,
  
  updateTask: (taskId: string, updates: Partial<Task>) => 
    supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        dependencies: updates.dependencies,
        updated_at: updates.updatedAt || new Date().toISOString(),
        prd_link: updates.prdLink,
        verification_criteria: updates.verificationCriteria,
        execution_count: updates.executionCount,
        assigned_agent: updates.assignedAgent,
        last_run_at: updates.lastRunAt
      })
      .eq('id', taskId) as unknown as Promise<{ data: any, error: any }>,
  
  deleteTask: (taskId: string) => 
    supabase
      .from('tasks')
      .delete()
      .eq('id', taskId) as unknown as Promise<{ data: any, error: any }>,

  // Task logs operations
  getTaskLogs: (taskId: string) => 
    supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('timestamp', { ascending: true }) as unknown as Promise<{ data: TaskLog[] | null, error: any }>
};
