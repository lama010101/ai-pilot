
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTaskOutput = (taskId: string | null) => {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchOutput = async () => {
      const { data, error } = await supabase
        .from('task_outputs')
        .select('content')
        .eq('task_id', taskId)
        .single();

      if (error) {
        console.error('❌ Supabase error fetching output:', error);
        setError('Failed to fetch output');
        return;
      }

      setOutput(data?.content ?? null);
    };

    fetchOutput();

    // Subscribe to real-time updates for this task's output
    const channel = supabase
      .channel('task-outputs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'task_outputs',
        filter: `task_id=eq.${taskId}`
      }, (payload) => {
        setOutput(payload.new.content);
      })
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  return { output, error };
};
