
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectSelector from './ProjectSelector';
import KanbanView from './KanbanView';
import TableView from './TableView';
import TaskCreator from './TaskCreator';
import TaskLogViewer from './TaskLogViewer';
import { Task, TaskStatus } from './taskTypes';
import { toast } from "sonner";
import { useTaskExecution } from '@/hooks/useTaskExecution';
import { tasksClient } from '@/lib/customSupabase';

const TaskManager = () => {
  const [selectedProject, setSelectedProject] = useState<string>('guess-history');
  const [viewType, setViewType] = useState<'kanban' | 'table'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [logViewerOpen, setLogViewerOpen] = useState<boolean>(false);
  
  const { 
    executeTask, 
    isExecuting, 
    currentTaskId,
    taskLogs,
    getTaskLogs
  } = useTaskExecution();

  // Load tasks from Supabase on mount and when project changes
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoadingTasks(true);
      try {
        // Attempt to load tasks from Supabase
        const { data, error } = await tasksClient.getTasks(selectedProject);
          
        if (error) {
          console.error('Error loading tasks:', error);
          // Fall back to local state for now
          setTasks([]);
        } else if (data && data.length > 0) {
          // Map from DB format to our Task type (already done by our custom client)
          setTasks(data);
        } else {
          // No tasks found, use empty array
          setTasks([]);
        }
      } catch (err) {
        console.error('Failed to load tasks:', err);
        // Fall back to local state
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    
    loadTasks();
  }, [selectedProject]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleCreateTask = async (newTask: Task) => {
    // For now we'll handle the creation in memory and also try to save to Supabase
    setTasks([...tasks, newTask]);
    
    try {
      // Try to insert task into Supabase using our custom client
      const { error } = await tasksClient.createTask(newTask);
      
      if (error) {
        console.error('Error saving task to Supabase:', error);
        toast.error('Task saved locally but failed to save to database');
      }
    } catch (err) {
      console.error('Failed to save task to Supabase:', err);
      toast.error('Task saved locally but failed to save to database');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    // Update local state
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);
    
    try {
      // Try to update task in Supabase using our custom client
      const { error } = await tasksClient.updateTask(updatedTask.id, updatedTask);
        
      if (error) {
        console.error('Error updating task in Supabase:', error);
        toast.error('Task updated locally but failed to update in database');
      }
    } catch (err) {
      console.error('Failed to update task in Supabase:', err);
      toast.error('Task updated locally but failed to update in database');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Update local state
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    setTasks(filteredTasks);
    
    try {
      // Try to delete task from Supabase using our custom client
      const { error } = await tasksClient.deleteTask(taskId);
        
      if (error) {
        console.error('Error deleting task from Supabase:', error);
        toast.error('Task deleted locally but failed to delete from database');
      }
    } catch (err) {
      console.error('Failed to delete task from Supabase:', err);
      toast.error('Task deleted locally but failed to delete from database');
    }
  };

  const handleRunTask = async (taskId: string) => {
    if (isExecuting) {
      toast.warning('Another task is already running');
      return;
    }
    
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast.error(`Task ${taskId} not found`);
      return;
    }
    
    // Update the status locally first for immediate feedback
    const updatedTask = { ...task, status: 'running' as TaskStatus };
    handleUpdateTask(updatedTask);
    
    toast.info(`Task ${taskId} is now running`);
    
    // Execute the task
    const success = await executeTask(updatedTask);
    
    // Update the task status based on execution result
    if (success) {
      const completedTask = { 
        ...updatedTask, 
        status: 'done' as TaskStatus,
        updatedAt: new Date().toISOString(),
        executionCount: (updatedTask.executionCount || 0) + 1
      };
      handleUpdateTask(completedTask);
    } else {
      const failedTask = { 
        ...updatedTask, 
        status: 'failed' as TaskStatus,
        updatedAt: new Date().toISOString(),
        executionCount: (updatedTask.executionCount || 0) + 1
      };
      handleUpdateTask(failedTask);
    }
  };

  const handleViewTaskLogs = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setLogViewerOpen(true);
    // Pre-fetch logs when opening the viewer
    await getTaskLogs(taskId);
  };

  const handleCloseLogViewer = () => {
    setLogViewerOpen(false);
    setSelectedTaskId(null);
  };

  const handleRetryTask = async (taskId: string) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast.error(`Task ${taskId} not found`);
      return;
    }
    
    // Update status to retrying
    const retryingTask = { 
      ...task, 
      status: 'running' as TaskStatus,
      updatedAt: new Date().toISOString()
    };
    handleUpdateTask(retryingTask);
    
    // Re-execute the task
    await handleRunTask(taskId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ProjectSelector 
          selectedProject={selectedProject} 
          onProjectChange={handleProjectChange} 
        />
        <TaskCreator 
          projectId={selectedProject} 
          onTaskCreated={handleCreateTask} 
        />
      </div>
      
      <Tabs value={viewType} onValueChange={(value) => setViewType(value as 'kanban' | 'table')}>
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban">
          <KanbanView 
            tasks={tasks} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask}
            onRunTask={handleRunTask}
            onViewLogs={handleViewTaskLogs}
            onRetryTask={handleRetryTask}
            isLoading={isLoadingTasks}
            runningTaskId={currentTaskId}
          />
        </TabsContent>
        
        <TabsContent value="table">
          <TableView 
            tasks={tasks} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask}
            onRunTask={handleRunTask}
            onViewLogs={handleViewTaskLogs}
            onRetryTask={handleRetryTask}
            isLoading={isLoadingTasks}
            runningTaskId={currentTaskId}
          />
        </TabsContent>
      </Tabs>

      <TaskLogViewer 
        taskId={selectedTaskId}
        open={logViewerOpen}
        onClose={handleCloseLogViewer}
      />
    </div>
  );
};

export default TaskManager;
