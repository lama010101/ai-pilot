
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { agents } from "@/data/agents";
import { useEffect, useState } from "react";
import { getActivityLogs, getAgents } from "@/lib/supabaseService";
import { ActivityLogDB, AgentDB } from "@/lib/supabaseTypes";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLogDB[]>([]);
  const [dbAgents, setDbAgents] = useState<AgentDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch activity logs
        const { data: logData, error: logError } = await getActivityLogs(10);
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

    fetchData();
  }, []);

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
                    {agents.map((agent) => (
                      <tr key={agent.id} className="border-t">
                        <td className="p-3">
                          <Link to={`/dashboard/agents/${agent.id}`} className="hover:underline font-medium">
                            {agent.name}
                          </Link>
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
    </div>
  );
};

export default Dashboard;
