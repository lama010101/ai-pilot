
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Timeline, TimelineItem } from "@/components/Timeline";
import { 
  getAppSpecById, 
  updateAppSpec, 
  getAgentChain,
  getAgentById,
  getTasksForAppSpec,
  getTaskMemory,
  injectZapWriterTask
} from "@/lib/supabaseService";
import { AppSpecDB, AgentTaskDB, AgentDB, TaskMemoryDB } from "@/lib/supabaseTypes";
import { toast } from "sonner";
import { 
  ArrowDown, 
  ArrowUp, 
  CheckCircle, 
  Circle, 
  FileText, 
  PenLine,
  Code, 
  TestTube, 
  Upload,
  ScrollText
} from "lucide-react";
import RunAgentChainButton from "@/components/RunAgentChainButton";
import { useManualTriggersEnabled } from "@/components/DeveloperSettings";

const AppDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [appSpec, setAppSpec] = useState<AppSpecDB | null>(null);
  const [agentChain, setAgentChain] = useState<AgentTaskDB[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentDB>>({});
  const [taskMemories, setTaskMemories] = useState<Record<string, TaskMemoryDB[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const manualTriggersEnabled = useManualTriggersEnabled();

  const fetchAppDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch app spec
      const { data: appData, error: appError } = await getAppSpecById(id);
      if (appError) throw appError;
      
      if (appData) {
        setAppSpec(appData);
        
        // Fetch tasks for this app spec
        const { data: tasksData } = await getTasksForAppSpec(id);
        if (tasksData && tasksData.length > 0) {
          // Use the first Writer task as parent
          const writerTask = tasksData.find(t => 
            t.agent_id === 'zapwriter' || t.agent_id.startsWith('writer-')
          );
          
          if (writerTask) {
            // Get the full agent chain
            const { data: chainData } = await getAgentChain(writerTask.id);
            if (chainData) {
              setAgentChain(chainData);
              
              // Fetch agent details for each task
              const agentIds = [...new Set(chainData.map(t => t.agent_id))];
              const agentDetails: Record<string, AgentDB> = {};
              
              for (const agentId of agentIds) {
                const { data: agentData } = await getAgentById(agentId);
                if (agentData) {
                  agentDetails[agentId] = agentData;
                }
              }
              
              setAgents(agentDetails);
              
              // Fetch task memories for each task
              const memories: Record<string, TaskMemoryDB[]> = {};
              for (const task of chainData) {
                const { data: memoryData } = await getTaskMemory(task.id);
                if (memoryData && memoryData.length > 0) {
                  memories[task.id] = memoryData;
                }
              }
              setTaskMemories(memories);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching app details:", error);
      toast.error("Failed to load app details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppDetails();
  }, [id]);
  
  // Inject ZapWriter Task if none exists
  useEffect(() => {
    const injectTask = async () => {
      try {
        await injectZapWriterTask();
      } catch (error) {
        console.error("Error injecting ZapWriter task:", error);
      }
    };
    
    injectTask();
  }, []);

  const handleStatusChange = async (newStatus: AppSpecDB['status']) => {
    if (!appSpec) return;
    
    try {
      const { data, error } = await updateAppSpec(appSpec.id, {
        ...appSpec,
        status: newStatus
      });
      
      if (error) throw error;
      
      if (data) {
        setAppSpec(data);
        toast.success(`App status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Error updating app status:", error);
      toast.error("Failed to update app status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'in_progress': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-800 border-green-200';
      case 'deployed': return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <Circle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Circle className="h-5 w-5 text-amber-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'writer':
        return <PenLine className="h-5 w-5" />;
      case 'coder':
        return <Code className="h-5 w-5" />;
      case 'tester':
        return <TestTube className="h-5 w-5" />;
      case 'admin':
        return <Upload className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!appSpec) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">App not found</h2>
        <p className="text-muted-foreground mt-2">The requested app specification could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{appSpec.name}</h1>
            <Badge variant="outline" className={getStatusColor(appSpec.status)}>
              {appSpec.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{appSpec.description}</p>
        </div>
        <div className="flex gap-2">
          {appSpec.status === 'draft' && (
            <Button onClick={() => handleStatusChange('in_progress')}>
              Start Development
            </Button>
          )}
          {appSpec.status === 'in_progress' && (
            <Button onClick={() => handleStatusChange('completed')}>
              Mark as Completed
            </Button>
          )}
          {appSpec.status === 'completed' && (
            <Button onClick={() => handleStatusChange('deployed')}>
              Deploy App
            </Button>
          )}
          
          {/* Add Run Agent Chain button */}
          {manualTriggersEnabled && agentChain.length > 0 && (
            <RunAgentChainButton 
              parentTaskId={agentChain[0].id}
              onSuccess={fetchAppDetails}
            />
          )}
        </div>
      </div>
      
      <Tabs defaultValue="spec">
        <TabsList>
          <TabsTrigger value="spec">Specification</TabsTrigger>
          <TabsTrigger value="chain">Agent Chain</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spec" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Specification</CardTitle>
              <CardDescription>
                The full specification for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {appSpec.content || "No specification content available."}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Chain</CardTitle>
              <CardDescription>
                The sequence of agents working on this app
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentChain.length > 0 ? (
                <Timeline>
                  {agentChain.map((task, index) => {
                    const agent = agents[task.agent_id];
                    return (
                      <TimelineItem key={task.id}>
                        <TimelineItem.Indicator>
                          {getTaskStatusIcon(task.status)}
                        </TimelineItem.Indicator>
                        <TimelineItem.Content>
                          <div className="flex items-center gap-2">
                            {agent && getRoleIcon(agent.role)}
                            <span className="font-medium">
                              {agent?.name || task.agent_id}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.timestamp).toLocaleString()}
                            </span>
                            {task.confidence && (
                              <Badge variant="outline">
                                {Math.round(task.confidence * 100)}% Confidence
                              </Badge>
                            )}
                            {task.mission_score && (
                              <Badge variant="outline" className={
                                task.mission_score > 80 
                                  ? 'bg-green-50 text-green-800 border-green-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }>
                                {task.mission_score}% Mission Aligned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1">{task.command.substring(0, 100)}...</p>
                        </TimelineItem.Content>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No agent chain data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Memory</CardTitle>
              <CardDescription>
                Knowledge and outputs from agent tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentChain.length > 0 ? (
                <div className="space-y-4">
                  {agentChain.map((task) => (
                    <div key={task.id} className="border p-4 rounded-md">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{agents[task.agent_id]?.name || task.agent_id}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <ArrowUp className="h-3 w-3" /> Prompt
                          </h4>
                          <p className="text-sm text-muted-foreground">{task.command}</p>
                        </div>
                        {task.result && (
                          <div>
                            <h4 className="text-sm font-medium flex items-center gap-1">
                              <ArrowDown className="h-3 w-3" /> Response
                            </h4>
                            <p className="text-sm text-muted-foreground">{task.result}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No task memory available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Add new Logs tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" /> Execution Logs
              </CardTitle>
              <CardDescription>
                Detailed logs of agent execution and task processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(taskMemories).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(taskMemories).map(([taskId, memories]) => {
                    const task = agentChain.find(t => t.id === taskId);
                    const agent = task ? agents[task.agent_id] : null;
                    
                    return (
                      <div key={taskId} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {agent && getRoleIcon(agent.role)}
                          <h3 className="font-medium">
                            {agent?.name || task?.agent_id || "Unknown Agent"}
                          </h3>
                          <Badge variant="outline" className={
                            task?.status === 'success' 
                              ? 'bg-green-50 text-green-800 border-green-200'
                              : task?.status === 'failure'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }>
                            {task?.status || "unknown"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          {memories.map((memory, index) => (
                            <div key={memory.id} className="bg-muted p-3 rounded-md">
                              <div className="flex justify-between mb-2">
                                <div className="text-sm font-medium">Log Entry #{index + 1}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(memory.timestamp).toLocaleString()}
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Input:</div>
                                  <div className="text-sm whitespace-pre-wrap">{memory.prompt}</div>
                                </div>
                                
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground">Output:</div>
                                  <div className="text-sm whitespace-pre-wrap">{memory.result}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No execution logs available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppDetail;
