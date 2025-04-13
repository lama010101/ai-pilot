
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TaskLog } from './taskTypes';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskLogViewerProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function TaskLogViewer({ taskId, open, onClose }: TaskLogViewerProps) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!taskId || !open) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('task_logs')
          .select('*')
          .eq('task_id', taskId)
          .order('timestamp', { ascending: true });
          
        if (error) {
          console.error('Error fetching logs:', error);
          toast.error('Failed to load task logs');
          return;
        }
        
        // Transform the data to match our TaskLog interface
        const transformedLogs: TaskLog[] = (data || []).map(log => ({
          id: log.id,
          taskId: log.task_id || '',
          timestamp: log.timestamp,
          message: log.message,
          level: log.level as 'info' | 'warning' | 'error' | 'success',
          context: log.context
        }));
        
        setLogs(transformedLogs);
      } catch (err) {
        console.error('Unexpected error fetching logs:', err);
        toast.error('Failed to load task logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Subscribe to real-time updates for this task's logs
    const channel = supabase
      .channel('task-logs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'task_logs',
        filter: `task_id=eq.${taskId}`
      }, (payload) => {
        // Transform the new log to match our TaskLog interface
        const newLog: TaskLog = {
          id: payload.new.id,
          taskId: payload.new.task_id || '',
          timestamp: payload.new.timestamp,
          message: payload.new.message,
          level: payload.new.level as 'info' | 'warning' | 'error' | 'success',
          context: payload.new.context
        };
        
        // Add the new log to our local state
        setLogs((prevLogs) => [...prevLogs, newLog]);
      })
      .subscribe();

    // Cleanup function
    return () => {
      channel.unsubscribe();
    };
  }, [taskId, open]);

  const LogIcon = ({ level }: { level: string }) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const LogEntry = ({ log }: { log: TaskLog }) => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    
    return (
      <div className="py-2 px-3 border-b last:border-0 flex items-start gap-2">
        <LogIcon level={log.level} />
        <div className="flex-1 text-sm">
          <div className="flex justify-between items-start">
            <div className="font-mono text-xs text-muted-foreground">{timestamp}</div>
          </div>
          <div className="mt-1">{log.message}</div>
        </div>
      </div>
    );
  };

  const LogContent = () => (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No logs available for this task
        </div>
      ) : (
        <ScrollArea className="h-[350px]">
          {logs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </ScrollArea>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Task Logs</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <LogContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Task Logs</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <Card>
            <LogContent />
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
