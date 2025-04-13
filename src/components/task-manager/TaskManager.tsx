
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectSelector from './ProjectSelector';
import KanbanView from './KanbanView';
import TableView from './TableView';
import TaskCreator from './TaskCreator';
import { Task, TaskStatus } from './taskTypes';
import { toast } from "sonner";

const TaskManager = () => {
  const [selectedProject, setSelectedProject] = useState<string>('guess-history');
  const [viewType, setViewType] = useState<'kanban' | 'table'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    // In a real implementation, we would load tasks for the selected project
    // For now, we'll just reset the tasks
    setTasks([]);
  };

  const handleCreateTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    setTasks(filteredTasks);
  };

  const handleRunTask = (taskId: string) => {
    // Update task status to running
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: 'running' as TaskStatus } : task
    );
    setTasks(updatedTasks);
    
    // In a real implementation, we would trigger the task execution process
    toast.info(`Task ${taskId} is now running`);
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
          />
        </TabsContent>
        
        <TabsContent value="table">
          <TableView 
            tasks={tasks} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask}
            onRunTask={handleRunTask}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskManager;
