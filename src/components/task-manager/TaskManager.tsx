
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectSelector from './ProjectSelector';
import KanbanView from './KanbanView';
import TableView from './TableView';
import TaskCreator from './TaskCreator';
import { Task, TaskStatus } from './taskTypes';
import { toast } from "sonner";
import { useTaskExecution } from '@/hooks/useTaskExecution';
import { supabase } from '@/integrations/supabase/client';

const TaskManager = () => {
  const [selectedProject, setSelectedProject] = useState<string>('guess-history');
  const [viewType, setViewType] = useState<'kanban' | 'table'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const { executeTask, isExecuting, currentTaskId } = useTaskExecution();

  // Load tasks from Supabase on mount and when project changes
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoadingTasks(true);
      try {
        // Attempt to load tasks from Supabase
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', selectedProject);
          
        if (error) {
          console.error('Error loading tasks:', error);
          // Fall back to local state for now
          setTasks([]);
        } else if (data && data.length > 0) {
          // Map from DB format to our Task type
          const mappedTasks: Task[] = data.map(task => ({
            id: task.id,
            projectId: task.project_id,
            title: task.title,
            description: task.description,
            status: task.status as TaskStatus,
            priority: task.priority,
            dependencies: task.dependencies || [],
            createdAt: task.created_at,
            updatedAt: task.updated_at,
            prdLink: task.prd_link,
            verificationCriteria: task.verification_criteria,
            logs: task.logs,
            executionCount: task.execution_count,
            assignedAgent: task.assigned_agent,
            lastRunAt: task.last_run_at
          }));
          setTasks(mappedTasks);
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
      // Try to insert task into Supabase
      const { error } = await supabase.from('tasks').insert({
        id: newTask.id,
        project_id: newTask.projectId,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        dependencies: newTask.dependencies,
        created_at: newTask.createdAt,
        updated_at: newTask.updatedAt,
        prd_link: newTask.prdLink,
        verification_criteria: newTask.verificationCriteria
      });
      
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
      // Try to update task in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          priority: updatedTask.priority,
          dependencies: updatedTask.dependencies,
          updated_at: new Date().toISOString(),
          prd_link: updatedTask.prdLink,
          verification_criteria: updatedTask.verificationCriteria,
          assigned_agent: updatedTask.assignedAgent
        })
        .eq('id', updatedTask.id);
        
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
      // Try to delete task from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
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
            isLoading={isLoadingTasks}
            runningTaskId={currentTaskId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskManager;
