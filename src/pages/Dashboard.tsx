
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { agents, activityLogs } from "@/data/agents";
import { useState } from "react";

const Dashboard = () => {
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
                  Last activity: {activityLogs[0]?.timestamp || 'None'}
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
                          <a href={`/dashboard/agents/${agent.id}`} className="hover:underline font-medium">
                            {agent.name}
                          </a>
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
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-4 pb-4 border-b">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary"></div>
                    <div className="flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
