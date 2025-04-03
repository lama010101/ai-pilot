
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Pilot Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Central control for autonomous AI agents
        </p>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Active Agents</TabsTrigger>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
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
                <CardTitle>Budget</CardTitle>
                <CardDescription>Monthly compute budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$100.00</div>
                <p className="text-xs text-muted-foreground mt-1">
                  $0.00 spent this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Core AIs</CardTitle>
                <CardDescription>Specialist AI agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5/5</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All core agents online
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Start building with AI Pilot</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              <button className="flex items-center justify-between p-3 border rounded-md hover:bg-card transition-colors">
                <span>Create New App</span>
                <span className="text-pilot-400 text-sm">Coming Soon</span>
              </button>
              <button className="flex items-center justify-between p-3 border rounded-md hover:bg-card transition-colors">
                <span>Deploy Agent</span>
                <span className="text-pilot-400 text-sm">Coming Soon</span>
              </button>
              <button className="flex items-center justify-between p-3 border rounded-md hover:bg-card transition-colors">
                <span>Security Audit</span>
                <span className="text-pilot-400 text-sm">Coming Soon</span>
              </button>
            </CardContent>
          </Card>
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
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3">Pilot</td>
                      <td className="p-3">Core</td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Online
                        </span>
                      </td>
                      <td className="p-3">Just now</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Writer</td>
                      <td className="p-3">Core</td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Online
                        </span>
                      </td>
                      <td className="p-3">2m ago</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Code Builder</td>
                      <td className="p-3">Core</td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Online
                        </span>
                      </td>
                      <td className="p-3">5m ago</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Tester</td>
                      <td className="p-3">Core</td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Online
                        </span>
                      </td>
                      <td className="p-3">10m ago</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Security</td>
                      <td className="p-3">Core</td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Online
                        </span>
                      </td>
                      <td className="p-3">15m ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Tasks executed by AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                No tasks have been executed yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
