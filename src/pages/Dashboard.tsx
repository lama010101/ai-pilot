
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/data/agents";
import { useEffect, useState } from "react";
import { getActivityLogs, getAgents, createAgent, createActivityLog } from "@/lib/supabaseService";
import { ActivityLogDB, AgentDB } from "@/lib/supabaseTypes";
import { Link } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import SystemStatusBanner from "@/components/SystemStatusBanner";
import BudgetBanner from "@/components/BudgetBanner";
import AgentSpawnerModal from "@/components/AgentSpawnerModal";
import { USE_FAKE_AUTH } from "@/lib/supabaseClient";

const Dashboard = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLogDB[]>([]);
  const [dbAgents, setDbAgents] = useState<AgentDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const [filterAgentType, setFilterAgentType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch activity logs with filters
      const { data: logData, error: logError } = await getActivityLogs(
        10, 
        filterAgentType, 
        filterStatus
      );
      
      if (!logError && logData) {
        setActivityLogs(logData);
      }

      // Fetch agents
      const { data: agentData, error: agentError } = await getAgents();
      if (!agentError && agentData) {
        setDbAgents(agentData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAgentType, filterStatus]);

  useEffect(() => {
    // Set up polling for live mode
    if (liveMode) {
      const intervalId = setInterval(fetchData, 10000);
      return () => clearInterval(intervalId);
    }
  }, [liveMode, filterAgentType, filterStatus]);

  const handleCreateTestAgent = async () => {
    if (!USE_FAKE_AUTH) return;
    
    try {
      // Generate a random name
      const names = ["Test Bot", "QA Agent", "Debug Helper", "Validation AI"];
      const randomName = names[Math.floor(Math.random() * names.length)] + " " + Math.floor(Math.random() * 1000);
      
      const { data: newAgent, error } = await createAgent({
        name: randomName,
        role: "Tester",
        phase: 1,
        is_ephemeral: true
      });
      
      if (error) throw error;
      
      if (newAgent) {
        // Add to local state (optimistic update)
        setDbAgents([newAgent, ...dbAgents]);
        
        // Log activity
        await createActivityLog({
          agent_id: newAgent.id,
          action: "agent_created",
          summary: `${newAgent.name} was created as a test agent`,
          status: "success"
        });
        
        toast.success(`Test agent "${newAgent.name}" created successfully`);
        
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Error creating test agent:", error);
      toast.error("Failed to create test agent");
    }
  };

  // Filter agents based on criteria
  const filteredAgents = agents.filter(agent => {
    if (filterStatus && agent.status !== filterStatus) return false;
    // We don't have agent types in our mock data, but we would filter here
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Pilot, Leader</h1>
        <p className="text-muted-foreground mt-1">
          Central control for autonomous AI agents
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SystemStatusBanner />
        <BudgetBanner />
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="live-mode">Live Mode</Label>
            <Switch
              id="live-mode"
              checked={liveMode}
              onCheckedChange={setLiveMode}
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAgentType} onValueChange={setFilterAgentType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="Writer">Writer</SelectItem>
              <SelectItem value="Coder">Coder</SelectItem>
              <SelectItem value="Researcher">Researcher</SelectItem>
              <SelectItem value="Tester">Tester</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData} 
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} /> Refresh
          </Button>
          
          <Button 
            size="sm" 
            onClick={() => setIsAgentModalOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus size={14} /> Add Agent
          </Button>
          
          {USE_FAKE_AUTH && (
            <Button 
              size="sm"
              variant="outline"
              onClick={handleCreateTestAgent}
              className="flex items-center gap-1"
            >
              <Plus size={14} /> Spawn Test Agent
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Active Agents</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Phase</CardTitle>
                <CardDescription>Current development phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Phase 1</div>
                <p className="text-xs text-muted-foreground mt-1">
                  System Bootstrapping
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Agents</CardTitle>
                <CardDescription>Active AI agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {agents.filter(a => a.status === 'running').length} currently running
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Activity</CardTitle>
                <CardDescription>Recent agent activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activityLogs.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last activity: {activityLogs[0]?.timestamp 
                    ? new Date(activityLogs[0].timestamp).toLocaleString() 
                    : 'None'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Active AI Agents</CardTitle>
              <CardDescription>
                Autonomous AI agents currently active in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-3 text-left">Agent</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Last Activity</th>
                      <th className="p-3 text-left">Current Task</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="border-t">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Link to={`/dashboard/agents/${agent.id}`} className="hover:underline font-medium">
                              {agent.name}
                            </Link>
                            {dbAgents.find(a => a.id === agent.id)?.is_ephemeral && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                Ephemeral
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${
                              agent.status === 'running' ? 'bg-green-500' : 
                              agent.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                            }`}></span>
                            {agent.status === 'running' ? 'Running' : 
                             agent.status === 'error' ? 'Error' : 'Idle'}
                          </span>
                        </td>
                        <td className="p-3">{agent.lastActive}</td>
                        <td className="p-3">{agent.currentTask || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Recent activities by AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 pb-4 border-b">
                      <div className={`w-2 h-2 mt-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' :
                        log.status === 'failure' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm">{log.summary}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No activity logs recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AgentSpawnerModal 
        open={isAgentModalOpen} 
        onOpenChange={setIsAgentModalOpen} 
        onSuccess={fetchData}
      />
    </div>
  );
};

export default Dashboard;
