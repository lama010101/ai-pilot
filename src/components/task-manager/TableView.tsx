
import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from './taskTypes';
import { Play, Edit, Trash2, Loader2, RotateCcw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import TaskEvaluationSection from './TaskEvaluationSection';

interface TableViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onRunTask: (taskId: string) => void;
  onViewLogs: (taskId: string) => void;
  onRetryTask: (taskId: string) => void;
  isLoading?: boolean;
  runningTaskId?: string | null;
}

const TableView = ({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  onRunTask,
  onViewLogs,
  onRetryTask,
  isLoading = false,
  runningTaskId = null
}: TableViewProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      todo: { color: "bg-gray-200 text-gray-800", label: "To Do" },
      planning: { color: "bg-blue-200 text-blue-800", label: "Planning" },
      running: { color: "bg-yellow-200 text-yellow-800", label: "Running" },
      verifying: { color: "bg-purple-200 text-purple-800", label: "Verifying" },
      done: { color: "bg-green-200 text-green-800", label: "Done" },
      failed: { color: "bg-red-200 text-red-800", label: "Failed" }
    };
    
    const { color, label } = statusMap[status] || { color: "bg-gray-200 text-gray-800", label: status };
    
    return <Badge className={`${color}`}>{label}</Badge>;
  };
  
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { color: string, label: string }> = {
      critical: { color: "bg-red-200 text-red-800", label: "Critical" },
      high: { color: "bg-orange-200 text-orange-800", label: "High" },
      medium: { color: "bg-yellow-200 text-yellow-800", label: "Medium" },
      low: { color: "bg-blue-200 text-blue-800", label: "Low" }
    };
    
    const { color, label } = priorityMap[priority] || { color: "bg-gray-200 text-gray-800", label: priority };
    
    return <Badge className={`${color}`}>{label}</Badge>;
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading tasks...</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No tasks found. Create a new task to get started.
      </div>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id} onClick={() => handleViewTaskDetails(task)} className="cursor-pointer">
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(task.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onViewLogs(task.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    {task.status === 'todo' && (
                      <Button 
                        size="sm" 
                        onClick={() => onRunTask(task.id)}
                        disabled={runningTaskId !== null}
                      >
                        {runningTaskId === task.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Running
                          </>
                        ) : (
                          <>Run</>
                        )}
                      </Button>
                    )}
                    {task.status === 'failed' && (
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => onRetryTask(task.id)}
                        disabled={runningTaskId !== null}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {selectedTask && (
        <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{selectedTask.title}</DrawerTitle>
              <DrawerDescription>
                <div className="flex space-x-2 mt-1">
                  {getStatusBadge(selectedTask.status)}
                  {getPriorityBadge(selectedTask.priority)}
                </div>
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium">Description</h4>
                <p className="mt-1 text-muted-foreground">{selectedTask.description}</p>
              </div>
              
              {selectedTask.dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Dependencies</h4>
                  <p className="mt-1 text-muted-foreground">{selectedTask.dependencies.join(', ')}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Created</h4>
                  <p className="mt-1 text-muted-foreground">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Updated</h4>
                  <p className="mt-1 text-muted-foreground">{new Date(selectedTask.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedTask.executionCount !== undefined && selectedTask.executionCount > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Execution Count</h4>
                  <p className="mt-1 text-muted-foreground">{selectedTask.executionCount}</p>
                </div>
              )}
              
              <TaskEvaluationSection 
                task={selectedTask}
                onRetry={() => {
                  setDetailsOpen(false);
                  onRetryTask(selectedTask.id);
                }}
                isRetrying={runningTaskId === selectedTask.id}
              />
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewLogs(selectedTask.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Logs
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDeleteTask(selectedTask.id);
                    setDetailsOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default TableView;
