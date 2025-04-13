
export type TaskStatus = 'todo' | 'planning' | 'running' | 'verifying' | 'done' | 'failed';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[]; // Array of task IDs this task depends on
  createdAt: string;
  updatedAt: string;
  prdLink?: string;
  verificationCriteria?: string[];
  logs?: TaskLog[];
  executionCount?: number;
  assignedAgent?: string;
  lastRunAt?: string;
  error_summary?: string; // For failed tasks
  self_evaluation?: string; // For completed tasks
  retry_count?: number; // Number of times task has been retried
}

export interface TaskLog {
  id: string;
  taskId: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  context?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks?: Task[];
}
