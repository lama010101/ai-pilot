
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TaskStatus } from './taskTypes';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface KanbanViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onRunTask: (taskId: string) => void;
  isLoading?: boolean;
  runningTaskId?: string | null;
}

const KanbanView = ({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  onRunTask, 
  isLoading = false, 
  runningTaskId = null 
}: KanbanViewProps) => {
  const columns: TaskStatus[] = ['todo', 'planning', 'running', 'verifying', 'done', 'failed'];
  
  const getColumnTasks = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      // Moving to a different column, update task status
      const task = tasks.find(t => t.id === draggableId);
      if (task) {
        const updatedTask = {
          ...task,
          status: destination.droppableId as TaskStatus,
          updatedAt: new Date().toISOString()
        };
        onUpdateTask(updatedTask);
      }
    }
  };

  const getColumnTitle = (status: TaskStatus) => {
    const titles: Record<TaskStatus, string> = {
      todo: 'To Do',
      planning: 'Planning',
      running: 'Running',
      verifying: 'Verifying',
      done: 'Done',
      failed: 'Failed'
    };
    return titles[status];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-4">
          {columns.map(column => (
            <div key={column} className="flex flex-col space-y-2">
              <h3 className="font-medium text-sm">{getColumnTitle(column)}</h3>
              <Droppable droppableId={column}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-muted p-2 rounded-md min-h-[500px] flex-1"
                  >
                    {getColumnTasks(column).length === 0 && (
                      <div className="flex items-center justify-center h-16 text-sm text-muted-foreground">
                        No tasks
                      </div>
                    )}
                    {getColumnTasks(column).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2"
                          >
                            <CardHeader className="p-3 pb-0">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-sm">{task.title}</CardTitle>
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-1">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                              {task.dependencies.length > 0 && (
                                <div className="mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Dependencies: {task.dependencies.length}
                                  </span>
                                </div>
                              )}
                              {task.executionCount !== undefined && task.executionCount > 0 && (
                                <div className="mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Runs: {task.executionCount}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="p-2 flex justify-between">
                              <div className="flex space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => toast.info('Edit task feature coming soon')}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => onDeleteTask(task.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {column === 'todo' && (
                                <Button 
                                  size="sm" 
                                  className="h-7"
                                  onClick={() => onRunTask(task.id)}
                                  disabled={runningTaskId !== null}
                                >
                                  {runningTaskId === task.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Running
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3 mr-1" />
                                      Run
                                    </>
                                  )}
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanView;
