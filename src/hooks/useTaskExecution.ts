import { useState } from 'react';
import { Task, TaskLog } from '@/components/task-manager/taskTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTaskExecution() {
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<Record<string, TaskLog[]>>({});

  const executeTask = async (task: Task): Promise<boolean> => {
    if (isExecuting) {
      toast.warning('Another task is already executing');
      return false;
    }

    setIsExecuting(true);
    setCurrentTaskId(task.id);

    try {
      // First update the local state to show task as running
      const updatedTask: Task = {
        ...task,
        status: 'running',
        updatedAt: new Date().toISOString(),
        lastRunAt: new Date().toISOString(),
        executionCount: (task.executionCount || 0) + 1
      };

      // Call the Supabase Edge Function to run the task
      const { data, error } = await supabase.functions.invoke('run-task', {
        body: {
          taskId: task.id,
          project: task.projectId,
          taskPrompt: task.description,
          llm_model: 'simulated' // For now, we're just simulating
        }
      });

      if (error) {
        console.error('Error executing task:', error);
        toast.error(`Task execution failed: ${error.message}`);
        
        // Update local task logs with the error
        const errorLog: TaskLog = {
          id: `err-${Date.now()}`,
          taskId: task.id,
          timestamp: new Date().toISOString(),
          message: `Error: ${error.message}`,
          level: 'error'
        };
        
        setTaskLogs(prev => ({
          ...prev,
          [task.id]: [...(prev[task.id] || []), errorLog]
        }));
        
        return false;
      }

      // Handle the successful response
      console.log('Task execution result:', data);
      toast.success(data.message || 'Task executed successfully');
      
      // Update task logs from the response
      if (data.logs && Array.isArray(data.logs)) {
        const formattedLogs: TaskLog[] = data.logs.map((log: any) => ({
          id: log.id || `log-${Date.now()}-${Math.random()}`,
          taskId: task.id,
          timestamp: new Date().toISOString(),
          message: log.message,
          level: log.level || 'info',
          context: log.context
        }));
        
        setTaskLogs(prev => ({
          ...prev,
          [task.id]: [...(prev[task.id] || []), ...formattedLogs]
        }));
      }
      
      return true;
    } catch (err: any) {
      console.error('Unexpected error during task execution:', err);
      toast.error(`Task execution failed: ${err.message}`);
      return false;
    } finally {
      setIsExecuting(false);
      setCurrentTaskId(null);
    }
  };

  const getTaskLogs = async (taskId: string): Promise<TaskLog[]> => {
    // If we have logs in local state, return them
    if (taskLogs[taskId] && taskLogs[taskId].length > 0) {
      return taskLogs[taskId];
    }
    
    // Otherwise fetch them from Supabase
    try {
      const { data, error } = await supabase
        .from('task_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('timestamp', { ascending: true });
        
      if (error) {
        console.error('Error fetching task logs:', error);
        return [];
      }
      
      const formattedLogs: TaskLog[] = data.map(log => ({
        id: log.id,
        taskId: log.task_id,
        timestamp: log.timestamp,
        message: log.message,
        level: log.level,
        context: log.context
      }));
      
      // Update local state
      setTaskLogs(prev => ({
        ...prev,
        [taskId]: formattedLogs
      }));
      
      return formattedLogs;
    } catch (err) {
      console.error('Unexpected error fetching task logs:', err);
      return [];
    }
  };

  return {
    executeTask,
    getTaskLogs,
    isExecuting,
    currentTaskId,
    taskLogs
  };
}
