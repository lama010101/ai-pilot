
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
import { Play, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TableViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onRunTask: (taskId: string) => void;
}

const TableView = ({ tasks, onUpdateTask, onDeleteTask, onRunTask }: TableViewProps) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'todo': return 'outline';
      case 'planning': return 'secondary';
      case 'running': return 'default';
      case 'verifying': return 'default';
      case 'done': return 'success';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dependencies</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No tasks found. Create a new task to get started.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(task.priority)}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(task.status)}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>{task.dependencies.length}</TableCell>
                <TableCell>{new Date(task.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toast.info('Edit task feature coming soon')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {task.status === 'todo' && (
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => onRunTask(task.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableView;
