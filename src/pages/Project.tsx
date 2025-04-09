
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Database, CheckCircle, XCircle, Image, Settings, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Project = () => {
  const [projects, setProjects] = useState([
    {
      id: 'guess-history',
      name: 'Guess History',
      supabaseId: 'pbpcegbobdnqqkloousm',
      isConnected: true,
      agents: ['Writer', 'Builder', 'MetadataVerifier'],
      apps: ['Image Collector'],
      datasets: ['Historical Images (234)'],
      isPublic: true,
      isActive: true,
      lastActivity: '2 hours ago'
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activities, setActivities] = useState([
    { id: 1, action: 'Images saved', details: '5 new images added', timestamp: '2h ago' },
    { id: 2, action: 'Metadata verified', details: 'Batch #45 verified', timestamp: '3h ago' },
    { id: 3, action: 'Project created', details: 'Initial setup complete', timestamp: '2d ago' }
  ]);
  const { toast } = useToast();

  const refreshProjectStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // Simulate checking project connection status
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Projects refreshed",
        description: "All project connections have been verified",
      });
    } catch (error) {
      console.error("Error refreshing projects:", error);
      toast({
        title: "Refresh failed",
        description: "Could not verify project connections",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Projects | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage connected projects and their resources
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={refreshProjectStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh Status"}
          </Button>
        </div>
        
        {projects.map(project => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {project.name}
                    {project.isPublic && (
                      <Badge variant="outline" className="ml-2">Public</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center">
                        <Database size={14} className="mr-1" />
                        {project.supabaseId}
                      </span>
                      <span className="flex items-center">
                        {project.isConnected ? (
                          <CheckCircle size={14} className="text-green-500 mr-1" />
                        ) : (
                          <XCircle size={14} className="text-red-500 mr-1" />
                        )}
                        {project.isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant={project.isActive ? "default" : "secondary"}>
                    {project.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full rounded-none border-b">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="datasets">Datasets</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Linked Agents</h3>
                      <ul className="space-y-2">
                        {project.agents.map((agent, i) => (
                          <li key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">{agent.charAt(0)}</span>
                            </div>
                            {agent}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Active Apps</h3>
                      <ul className="space-y-2">
                        {project.apps.map((app, i) => (
                          <li key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">{app.charAt(0)}</span>
                            </div>
                            {app}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Datasets</h3>
                      <ul className="space-y-2">
                        {project.datasets.map((dataset, i) => (
                          <li key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Image size={16} />
                            {dataset}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="datasets" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Historical Images</h3>
                      <Badge>234 items</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image className="text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      View All Images
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="activity" className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Activity</h3>
                    
                    <div className="space-y-2">
                      {activities.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                          <Activity size={16} className="mt-1 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">{activity.details}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Project Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Public Access</p>
                            <p className="text-sm text-muted-foreground">Allow public access to this project</p>
                          </div>
                          <div className="flex items-center h-5">
                            <input
                              id="public-access"
                              type="checkbox"
                              checked={project.isPublic}
                              readOnly
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Active Status</p>
                            <p className="text-sm text-muted-foreground">Project is currently active</p>
                          </div>
                          <div className="flex items-center h-5">
                            <input
                              id="active-status"
                              type="checkbox"
                              checked={project.isActive}
                              readOnly
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="destructive">Delete Project</Button>
                      <Button>Save Changes</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default Project;
