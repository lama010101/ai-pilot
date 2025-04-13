
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

// Supabase client setup
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://zwdkywvgoowrqbhftbkc.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGt5d3Znb293cnFiaGZ0YmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NTk2MzksImV4cCI6MjA1OTIzNTYzOX0.HXZ9OEGAv6Qis1uCGEPv1NW_9g7HgXFofXnU_K82uYk";
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a simulated task output with a specified delay
async function simulateTaskExecution(taskId: string, projectId: string, description: string, llmModel?: string) {
  // Configure realtime for task_logs table if not already done
  try {
    await supabase.rpc('supabase_realtime.enable_table_publication', { table_name: 'task_logs' });
  } catch (error) {
    console.error("Error enabling realtime for task_logs:", error);
    // Continue execution even if this fails
  }

  // Log task start
  const startLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: startLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: `Starting task execution with ${llmModel || 'default model'}`,
    level: 'info',
  });

  // Simulate processing time (2-3 seconds)
  const executionTime = 2000 + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, executionTime));

  // Generate simulated logs
  const processingLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: processingLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: `Processing task for project "${projectId}": ${description.substring(0, 50)}...`,
    level: 'info',
  });

  // Small additional delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate "thinking" logs
  const thinkingLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: thinkingLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: "Analyzing requirements and formulating approach...",
    level: 'info',
  });

  // Small additional delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate "implementing" logs
  const implementingLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: implementingLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: "Implementing solution based on requirements...",
    level: 'info',
  });

  // Small additional delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Log successful completion
  const completionLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: completionLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: `✔ Task executed successfully using [simulated executor]`,
    level: 'success',
  });

  // Update task status in database
  await supabase.from('tasks').update({
    status: 'done',
    updated_at: new Date().toISOString(),
    last_run_at: new Date().toISOString(),
    execution_count: 1, // In a real implementation, we'd increment this
  }).eq('id', taskId);

  return {
    success: true,
    message: '✔ Task executed successfully using [simulated executor]',
    executionTime,
    logs: [
      { id: startLogId, level: 'info', message: `Starting task execution with ${llmModel || 'default model'}` },
      { id: processingLogId, level: 'info', message: `Processing task for project "${projectId}": ${description.substring(0, 50)}...` },
      { id: thinkingLogId, level: 'info', message: "Analyzing requirements and formulating approach..." },
      { id: implementingLogId, level: 'info', message: "Implementing solution based on requirements..." },
      { id: completionLogId, level: 'success', message: `✔ Task executed successfully using [simulated executor]` }
    ]
  };
}

// Function to simulate a task failure (randomly)
async function simulateTaskFailure(taskId: string, projectId: string, description: string) {
  // Log task start
  const startLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: startLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: `Starting task execution...`,
    level: 'info',
  });

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Log task processing
  const processingLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: processingLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: `Processing task for project "${projectId}"...`,
    level: 'info',
  });

  // Simulate additional processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Log task error
  const errorLogId = uuidv4();
  await supabase.from('task_logs').insert({
    id: errorLogId,
    task_id: taskId,
    timestamp: new Date().toISOString(),
    message: `Error: Unable to complete task due to [simulated error]. Please try again or refine the task description.`,
    level: 'error',
  });

  // Update task status in database
  await supabase.from('tasks').update({
    status: 'failed',
    updated_at: new Date().toISOString(),
    last_run_at: new Date().toISOString(),
  }).eq('id', taskId);

  return {
    success: false,
    message: 'Task execution failed [simulated error]',
    logs: [
      { id: startLogId, level: 'info', message: `Starting task execution...` },
      { id: processingLogId, level: 'info', message: `Processing task for project "${projectId}"...` },
      { id: errorLogId, level: 'error', message: `Error: Unable to complete task due to [simulated error]. Please try again or refine the task description.` }
    ]
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { taskId, project, taskPrompt, llm_model, retryCount } = await req.json();

    if (!taskId || !project) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: taskId and project' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Executing task ${taskId} for project ${project}`);

    // Simulate occasional task failure (20% chance) if not a retry
    const shouldFail = !retryCount && Math.random() < 0.2;
    
    let result;
    if (shouldFail) {
      result = await simulateTaskFailure(taskId, project, taskPrompt || "");
    } else {
      result = await simulateTaskExecution(taskId, project, taskPrompt || "", llm_model);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error executing task:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
