
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { agents, Agent } from '@/data/agents';
import { AgentTaskDB, AgentDB } from '@/lib/supabaseTypes';
import { getAgentById, getAgentTasks, createAgentTask, createActivityLog } from '@/lib/supabaseService';
import { toast } from 'sonner';

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | undefined>();
  const [agentConfig, setAgentConfig] = useState<AgentDB | null>(null);
  const [tasks, setTasks] = useState<AgentTaskDB[]>([]);
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Fetch agent data
    const fetchAgent = async () => {
      const { data, error } = await getAgentById(id);
      
      if (error || !data) {
        const localAgent = agents.find(a => a.id === id);
        if (localAgent) {
          setAgent(localAgent);
        } else {
          navigate('/dashboard');
          return;
        }
      } else {
        setAgentConfig(data);
        // Also update local agent from database for consistency
        const localAgent = agents.find(a => a.id === id);
        if (localAgent) {
          setAgent(localAgent);
        }
      }
      
      // Fetch tasks
      const { data: taskData, error: taskError } = await getAgentTasks(id);
      if (!taskError && taskData) {
        setTasks(taskData);
      }
    };
    
    fetchAgent();
  }, [id, navigate]);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const handleSimulateTask = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    toast.info(`${agent.name} is processing a new task...`);
    
    // Generate a random confidence score between 60-100
    const confidence = Math.floor(Math.random() * 41) + 60;
    
    // Randomly determine success or failure
    const status = Math.random() > 0.2 ? 'success' : 'failure';
    
    const defaultTask = agent.currentTask || 'System analysis';
    
    const result = status === 'success' 
      ? `Successfully completed ${defaultTask} with ${confidence}% confidence.`
      : `Encountered difficulties with ${defaultTask}. Partial completion at ${confidence}% confidence.`;
    
    setTimeout(async () => {
      try {
        // Create new task
        const { data: newTask, error } = await createAgentTask({
          agent_id: id!,
          command: `Execute: ${defaultTask}`,
          result,
          confidence,
          status,
        });
        
        if (error) throw error;
        
        // Add to task list (optimistic update)
        if (newTask) {
          setTasks([newTask, ...tasks]);
        }
        
        // Log activity
        await createActivityLog({
          agent_id: id!,
          action: 'execute_task',
          summary: `${agent.name} ${status === 'success' ? 'completed' : 'attempted'} ${defaultTask}`,
          status,
        });
        
        toast.success(`${agent.name} has completed the task`);
      } catch (error) {
        console.error('Error creating task:', error);
        toast.error(`Failed to process task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    }, 2000); // Simulate processing delay
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;
    
    setIsProcessing(true);
    toast.info(`${agent.name} is processing your command...`);
    
    // Generate a random confidence score between 60-100
    const confidence = Math.floor(Math.random() * 41) + 60;
    
    // Randomly determine success or failure
    const status = Math.random() > 0.2 ? 'success' : 'failure';
    
    setTimeout(async () => {
      try {
        // Generate AI-like response
        const result = status === 'success'
          ? `Command analyzed. ${confidence}% confidence in execution. Output: ${Math.random() > 0.5 ? 'Task complete with expected results.' : 'Objective achieved with minor optimizations.'}`
          : `Command processed with difficulties. ${confidence}% partial completion. Further clarification needed.`;
        
        // Create new task
        const { data: newTask, error } = await createAgentTask({
          agent_id: id!,
          command,
          result,
          confidence,
          status,
        });
        
        if (error) throw error;
        
        // Add to task list (optimistic update)
        if (newTask) {
          setTasks([newTask, ...tasks]);
        }
        
        // Log activity
        await createActivityLog({
          agent_id: id!,
          action: 'process_command',
          summary: `${agent.name} processed command: "${command.substring(0, 30)}${command.length > 30 ? '...' : ''}"`,
          status,
        });
        
        setCommand('');
        toast.success(`${agent.name} has processed your command`);
      } catch (error) {
        console.error('Error processing command:', error);
        toast.error(`Failed to process command: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    }, 2500); // Simulate processing delay
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${
            agent.status === 'running' ? 'bg-green-500' : 
            agent.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
          }`}></span>
          <span className="text-sm">
            {agent.status === 'running' ? 'Running' : 
             agent.status === 'error' ? 'Error' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Task</CardTitle>
            <CardDescription>What this agent is working on</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{agent.currentTask || 'No active task'}</p>
            <Button 
              onClick={handleSimulateTask} 
              className="mt-4"
              variant="secondary"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-background border-t-transparent animate-spin"></span>
                  Processing...
                </>
              ) : 'Simulate Task'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Command</CardTitle>
            <CardDescription>Issue a direct command to the agent</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendCommand} className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="flex-1"
                disabled={isProcessing}
              />
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                    Send
                  </>
                ) : 'Send'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Task History</TabsTrigger>
          <TabsTrigger value="config">Agent Config</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Agent Tasks</CardTitle>
              <CardDescription>Recent tasks and commands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto space-y-4">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-start space-x-4 pb-4 border-b last:border-0">
                      <div className={`mt-2 w-2 h-2 rounded-full ${
                        task.status === 'success' ? 'bg-green-500' : 
                        task.status === 'failure' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Command: {task.command}</p>
                        <p className="text-sm mt-1">{task.result}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            Confidence: {task.confidence}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(task.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No tasks recorded yet. Send a command or simulate a task.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>Technical details and settings</CardDescription>
            </CardHeader>
            <CardContent>
              {agentConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">ID</p>
                      <p className="text-sm text-muted-foreground">{agentConfig.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">{agentConfig.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-muted-foreground">{agentConfig.role}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Phase</p>
                      <p className="text-sm text-muted-foreground">{agentConfig.phase}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {agentConfig.is_ephemeral ? 'Ephemeral (Temporary)' : 'Persistent'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(agentConfig.last_updated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Agent configuration not available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDetail;
