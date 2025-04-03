
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle, Brain } from "lucide-react";
import { toast } from "sonner";
import { 
  getAgentById, 
  getAgentTasks, 
  createAgentTask,
  getAgentFeedback,
  getTaskMemory
} from "@/lib/supabaseService";
import { AgentDB, AgentTaskDB, AgentFeedbackDB, TaskMemoryDB } from "@/lib/supabaseTypes";
import { agents } from "@/data/agents";
import AgentFeedback from "@/components/AgentFeedback";
import FeedbackSummary from "@/components/FeedbackSummary";
import CommandSuggestions from "@/components/CommandSuggestions";
import RunAgentButton from "@/components/RunAgentButton";
import { useManualTriggersEnabled } from "@/components/DeveloperSettings";

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentDB | null>(null);
  const [tasks, setTasks] = useState<AgentTaskDB[]>([]);
  const [feedback, setFeedback] = useState<AgentFeedbackDB[]>([]);
  const [taskMemory, setTaskMemory] = useState<Record<string, TaskMemoryDB[]>>({});
  const [mockAgent, setMockAgent] = useState(agents.find(a => a.id === id));
  const [command, setCommand] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const manualTriggersEnabled = useManualTriggersEnabled();

  const fetchData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch agent details
      const { data: agentData, error: agentError } = await getAgentById(id);
      if (agentError) throw agentError;
      
      if (agentData) {
        setAgent(agentData);
      }
      
      // Fetch agent tasks
      const { data: taskData, error: taskError } = await getAgentTasks(id);
      if (taskError) throw taskError;
      
      if (taskData) {
        setTasks(taskData);
        
        // Fetch task memory for each task
        const memoryData: Record<string, TaskMemoryDB[]> = {};
        for (const task of taskData) {
          const { data: memory } = await getTaskMemory(task.id);
          if (memory) {
            memoryData[task.id] = memory;
          }
        }
        setTaskMemory(memoryData);
      }
      
      // Fetch agent feedback
      const { data: feedbackData, error: feedbackError } = await getAgentFeedback(id);
      if (feedbackError) throw feedbackError;
      
      if (feedbackData) {
        setFeedback(feedbackData);
      }
    } catch (error) {
      console.error("Error fetching agent data:", error);
      toast.error("Failed to fetch agent data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim() || !id) {
      toast.error("Please enter a command");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create a new task
      const { data: newTask, error } = await createAgentTask({
        agent_id: id,
        command,
        result: "Processing...",
        confidence: 0.75,
        status: 'processing'
      });
      
      if (error) throw error;
      
      if (newTask) {
        setTasks([newTask, ...tasks]);
        setCommand("");
        toast.success("Command submitted successfully");
        
        // After a delay, update the task to success to simulate processing
        setTimeout(async () => {
          const mockResult = `Task completed: ${command}\n\nThis is a simulated result from the AI agent.`;
          
          // Update the task locally
          const updatedTask = {
            ...newTask,
            result: mockResult,
            status: 'success' as const
          };
          
          // Update tasks list
          setTasks(prevTasks => 
            prevTasks.map(t => t.id === newTask.id ? updatedTask : t)
          );
          
          toast.info("Task completed", {
            description: "The agent has processed your command"
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Error submitting command:", error);
      toast.error("Failed to submit command");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommandSelect = (selectedCommand: string) => {
    setCommand(selectedCommand);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{agent?.name || mockAgent?.name}</h1>
            {agent?.is_ephemeral && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                Ephemeral
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {agent?.role || mockAgent?.description || "AI Assistant"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            mockAgent?.status === 'running' ? 'bg-green-500' :
            mockAgent?.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
          }`}></span>
          <span className="text-sm text-muted-foreground">
            {mockAgent?.status === 'running' ? 'Running' :
            mockAgent?.status === 'error' ? 'Error' : 'Idle'}
          </span>
          
          {/* Add Run Agent Now button */}
          {manualTriggersEnabled && id && (
            <RunAgentButton 
              agentId={id} 
              onSuccess={fetchData}
            />
          )}
        </div>
      </div>
      
      <form onSubmit={handleCommandSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Enter command for agent..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Command"}
          </Button>
        </div>
        <CommandSuggestions 
          agentRole={agent?.role || 'Default'} 
          onSelect={handleCommandSelect}
        />
      </form>
      
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task History</CardTitle>
              <CardDescription>
                Commands and results from this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map(task => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium truncate">
                          {task.command}
                        </h3>
                        <div className="flex items-center">
                          {task.status === 'success' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                            </Badge>
                          )}
                          {task.status === 'failure' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" /> Failed
                            </Badge>
                          )}
                          {task.status === 'processing' && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Processing
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        {new Date(task.timestamp).toLocaleString()}
                      </div>
                      
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                        {task.result}
                      </div>
                      
                      {task.mission_score !== undefined && (
                        <div className="mt-2 text-sm">
                          <Badge variant="outline" className={
                            task.mission_score > 80 
                              ? 'bg-green-50 text-green-800 border-green-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }>
                            {task.mission_score}% Mission Aligned
                          </Badge>
                        </div>
                      )}
                      
                      {task.cost !== undefined && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Cost: ${task.cost.toFixed(4)}
                          </span>
                        </div>
                      )}
                      
                      {task.status === 'success' && (
                        <div className="mt-4">
                          <AgentFeedback 
                            agentId={id || ''}
                            taskId={task.id}
                            onFeedbackSubmitted={fetchData}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No tasks found for this agent.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback">
          <FeedbackSummary 
            feedback={feedback}
            loading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain size={18} /> Memory
              </CardTitle>
              <CardDescription>
                Stored knowledge from previous tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(taskMemory).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(taskMemory).map(([taskId, memories]) => {
                    const task = tasks.find(t => t.id === taskId);
                    return (
                      <div key={taskId} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">
                          Task: {task?.command?.substring(0, 50)}...
                        </h3>
                        <div className="space-y-3">
                          {memories.map(memory => (
                            <div key={memory.id} className="space-y-2">
                              <div className="bg-muted p-3 rounded text-sm">
                                <div className="font-medium mb-1">Prompt</div>
                                <div className="text-muted-foreground whitespace-pre-wrap">
                                  {memory.prompt}
                                </div>
                              </div>
                              <div className="bg-muted p-3 rounded text-sm">
                                <div className="font-medium mb-1">Result</div>
                                <div className="text-muted-foreground whitespace-pre-wrap">
                                  {memory.result}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Timestamp: {new Date(memory.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No memory data stored for this agent.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDetail;
