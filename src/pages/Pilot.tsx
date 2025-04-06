
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Rocket, Code, MessageSquare, Database, Settings, LayoutGrid } from "lucide-react";
import { getAgents, getActivityLogs } from "@/lib/supabaseService";
import { useBuildHistory } from "@/hooks/useBuildHistory";
import { AgentDB } from "@/lib/supabaseTypes";
import { agents } from "@/data/agents";

const Pilot = () => {
  const [dbAgents, setDbAgents] = useState<AgentDB[]>([]);
  const [activeAgents, setActiveAgents] = useState(0);
  const [logs, setLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { appBuilds } = useBuildHistory();
  
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch agents data
        const { data: agentsData } = await getAgents();
        if (agentsData) {
          setDbAgents(agentsData);
          // Calculate active agents based on mock data since AgentDB doesn't have status
          setActiveAgents(agents.filter(a => a.status === 'running').length);
        }
        
        // Fetch log count
        const { data: logsData } = await getActivityLogs(100);
        if (logsData) {
          setLogs(logsData.length);
        }
      } catch (error) {
        console.error("Error fetching system data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSystemData();
  }, []);
  
  const handleNavigate = (path: string) => {
    navigate(path);
  };
  
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
        <h1 className="text-3xl font-bold">Pilot Control Center</h1>
        <p className="text-muted-foreground mt-1">
          Central command for autonomous AI operations
        </p>
      </div>
      
      {/* System Status Overview */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Rocket className="mr-2 h-4 w-4" /> System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
              <span className="font-medium">Operational</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              All systems nominal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Activity className="mr-2 h-4 w-4" /> Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}/{dbAgents.length}</div>
            <p className="text-sm text-muted-foreground">Active agents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Code className="mr-2 h-4 w-4" /> App Builds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appBuilds.length}</div>
            <p className="text-sm text-muted-foreground">
              {appBuilds.length > 0 ? `Last build: ${new Date(appBuilds[0]?.created_at).toLocaleDateString()}` : 'No builds yet'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Database className="mr-2 h-4 w-4" /> Memory Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs}</div>
            <p className="text-sm text-muted-foreground">Stored memory entries</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Action Buttons */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Control Center</CardTitle>
            <CardDescription>Quick actions to manage your system</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={() => handleNavigate('/dashboard/builder')}
            >
              <Code className="h-8 w-8" />
              <span>App Builder</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={() => handleNavigate('/dashboard/agents')}
            >
              <Rocket className="h-8 w-8" />
              <span>Manage Agents</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={() => handleNavigate('/dashboard/memory')}
            >
              <Database className="h-8 w-8" />
              <span>Memory</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={() => handleNavigate('/dashboard/apps')}
            >
              <LayoutGrid className="h-8 w-8" />
              <span>Apps</span>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Agents</CardTitle>
            <CardDescription>AI agents currently in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.length > 0 ? (
                agents.slice(0, 4).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full ${
                        agent.status === 'running' ? 'bg-green-500' : 
                        agent.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                      } mr-2`}></div>
                      <span>{agent.name}</span>
                    </div>
                    <Badge variant={agent.status === 'running' ? 'default' : 'outline'}>
                      {agent.status || 'Idle'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No agents configured</p>
              )}
              {agents.length > 4 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm"
                  onClick={() => handleNavigate('/dashboard/agents')}
                >
                  View all {agents.length} agents
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest operations and events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {appBuilds.slice(0, 5).map((build, index) => (
            <div key={index} className="flex items-start space-x-4 pb-4 border-b">
              <div className="h-2 w-2 mt-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm">Build completed: {build.prompt || 'Untitled build'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(build.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {appBuilds.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Pilot;
