
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Activity, Rocket, Code, MessageSquare, Database, Settings, LayoutGrid, Image } from "lucide-react";
import { getAgents, getActivityLogs } from "@/lib/supabaseService";
import { useBuildHistory } from "@/hooks/useBuildHistory";
import { AgentDB } from "@/lib/supabaseTypes";
import { agents } from "@/data/agents";
import { toast } from "sonner";

const PilotDashboard = () => {
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
        toast.error("Failed to load dashboard data. Please try again.");
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
        <p className="ml-3 text-lg text-muted-foreground">Loading Pilot Control Center...</p>
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
      
      {/* Quick Access Tabs */}
      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-32 space-y-2"
              onClick={() => handleNavigate('/builder')}
            >
              <Code className="h-8 w-8" />
              <span>App Builder</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-32 space-y-2"
              onClick={() => handleNavigate('/image-upload')}
            >
              <Image className="h-8 w-8" />
              <span>Image Collector</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-32 space-y-2"
              onClick={() => handleNavigate('/memory')}
            >
              <Database className="h-8 w-8" />
              <span>Memory</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-32 space-y-2"
              onClick={() => handleNavigate('/chat')}
            >
              <MessageSquare className="h-8 w-8" />
              <span>Universal Chat</span>
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Agents</CardTitle>
              <CardDescription>AI agents currently in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.length > 0 ? (
                  agents.map((agent) => (
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
                <Button 
                  variant="ghost" 
                  className="w-full text-sm"
                  onClick={() => handleNavigate('/pilot')}
                >
                  View full Pilot interface
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
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
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => handleNavigate('/memory')}
              >
                View all system logs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure API keys and system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 space-y-2"
                  onClick={() => handleNavigate('/settings/api')}
                >
                  <Settings className="h-6 w-6" />
                  <span>API Settings</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 space-y-2"
                  onClick={() => handleNavigate('/settings/budget')}
                >
                  <Activity className="h-6 w-6" />
                  <span>Budget Controls</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 space-y-2"
                  onClick={() => handleNavigate('/settings/api-keys')}
                >
                  <Database className="h-6 w-6" />
                  <span>API Keys</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 space-y-2"
                  onClick={() => handleNavigate('/settings/developer')}
                >
                  <Code className="h-6 w-6" />
                  <span>Developer Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PilotDashboard;
