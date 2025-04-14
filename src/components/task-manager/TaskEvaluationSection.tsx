
import React from 'react';
import { Button } from '@/components/ui/button';
import { Task } from './taskTypes';
import { Loader2 } from 'lucide-react';
import { useTaskOutput } from '@/hooks/useTaskOutput';

interface TaskEvaluationSectionProps {
  task: Task;
  onRetry: () => void;
  isRetrying: boolean;
}

export default function TaskEvaluationSection({ 
  task, 
  onRetry, 
  isRetrying 
}: TaskEvaluationSectionProps) {
  const { output, error } = useTaskOutput(task.id);

  return (
    <section className="mt-6 border-t pt-4">
      <h3 className="font-mono text-sm font-medium">Self-Evaluation</h3>
      <div className="text-muted-foreground text-sm mt-2">
        {task.status === 'done' ? (
          <p>✅ Task completed successfully (AI review coming soon)</p>
        ) : task.status === 'failed' ? (
          <p>❌ Failed to complete task. You may retry the execution.</p>
        ) : null}
      </div>
      
      <div className="mt-4 flex space-x-2">
        {(task.status === 'failed') && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>🔁 Retry Task</>
            )}
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          disabled={true}
          className="text-xs"
        >
          💾 Send to Memory (Phase 3)
        </Button>
      </div>

      {task.status === 'done' && (
        <div className="mt-4 bg-muted p-4 border rounded max-h-96 overflow-auto">
          <h4 className="text-sm font-mono mb-1">📄 Task Output</h4>

          {error ? (
            <p className="text-xs text-red-500">Error: {error}</p>
          ) : output?.startsWith('http') ? (
            <img 
              src={output} 
              alt="Generated Output" 
              className="rounded max-w-full object-contain" 
            />
          ) : output ? (
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
              {output}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground">No output available.</p>
          )}
        </div>
      )}
    </section>
  );
}
