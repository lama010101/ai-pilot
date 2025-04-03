
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CircleDollarSign, 
  TrendingUp, 
  BarChart, 
  Clock, 
  ShieldCheck, 
  AlertOctagon 
} from "lucide-react";
import { getCostLogs, getBudgetSettings } from "@/lib/supabaseService";
import { CostLogDB } from "@/lib/supabaseTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Chart import - we're using recharts
import { 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const FinanceAI = () => {
  const [costLogs, setCostLogs] = useState<CostLogDB[]>([]);
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [budgetLimit, setBudgetLimit] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: logs } = await getCostLogs();
        if (logs) {
          setCostLogs(logs);
          
          // Calculate monthly spend
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonth = logs.filter(log => 
            new Date(log.timestamp) >= startOfMonth
          );
          const total = thisMonth.reduce((sum, log) => sum + log.cost, 0);
          setMonthlySpend(total);
        }
        
        const { data: budgetSettings } = await getBudgetSettings();
        if (budgetSettings) {
          setBudgetLimit(budgetSettings.monthly_limit);
        }
      } catch (error) {
        console.error("Error fetching finance data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Generate spending by day chart data
  const getSpendingByDayData = () => {
    const now = new Date();
    const daysAgo30 = new Date(now);
    daysAgo30.setDate(now.getDate() - 30);
    
    // Create a map of dates to costs
    const dayMap: Record<string, number> = {};
    
    // Initialize with the past 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dayMap[dateStr] = 0;
    }
    
    // Fill in actual costs
    costLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      
      if (date >= daysAgo30 && dayMap[dateStr] !== undefined) {
        dayMap[dateStr] += log.cost;
      }
    });
    
    // Convert to array for Recharts
    return Object.entries(dayMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, cost]) => ({
        date,
        cost,
      }));
  };
  
  // Generate spending by agent chart data
  const getSpendingByAgentData = () => {
    const agentMap: Record<string, number> = {};
    
    costLogs.forEach(log => {
      if (!agentMap[log.agent_id]) {
        agentMap[log.agent_id] = 0;
      }
      agentMap[log.agent_id] += log.cost;
    });
    
    return Object.entries(agentMap)
      .sort(([, costA], [, costB]) => costB - costA)
      .map(([agent_id, cost]) => ({
        agent_id,
        cost,
      }));
  };
  
  // Generate task distribution chart data
  const getTaskDistributionData = () => {
    const taskCount: Record<string, number> = {
      'Writer': 0,
      'Coder': 0,
      'Researcher': 0,
      'Tester': 0,
      'Finance': 0,
      'Other': 0
    };
    
    // This is mock data since we don't have real task type data
    costLogs.forEach((_, index) => {
      const types = Object.keys(taskCount);
      const type = types[index % (types.length - 1)]; // Distribute evenly except "Other"
      taskCount[type]++;
    });
    
    // Add a random number to "Other"
    taskCount['Other'] = Math.floor(Math.random() * 5);
    
    return Object.entries(taskCount)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
      }));
  };
  
  // Generate some fake spending projections
  const getProjectionData = () => {
    const currentSpend = monthlySpend;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const projectedTotal = (currentSpend / currentDay) * daysInMonth;
    
    return {
      current: currentSpend,
      projected: projectedTotal,
      limit: budgetLimit
    };
  };
  
  // Generate colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#888888'];
  
  // Recharts responsive container wrapper
  const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  const projectionData = getProjectionData();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            Finance AI Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Budget monitoring and cost optimization
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch id="auto-kill" />
            <Label htmlFor="auto-kill">Auto-Kill Expensive Tasks</Label>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Current Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlySpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Budget Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budgetLimit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Phase 1 allocation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Projected Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${projectionData.projected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              By end of month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cost Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectionData.projected <= budgetLimit ? 'Good' : 'Warning'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              System is {projectionData.projected <= budgetLimit ? 'under' : 'over'} budget
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">By Agent</TabsTrigger>
          <TabsTrigger value="tasks">Task Distribution</TabsTrigger>
          <TabsTrigger value="logs">Cost Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Daily cost over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartWrapper>
                <AreaChart data={getSpendingByDayData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Area type="monotone" dataKey="cost" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ChartWrapper>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Agent</CardTitle>
              <CardDescription>Total costs incurred per agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartWrapper>
                <RechartsBarChart data={getSpendingByAgentData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent_id" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Bar dataKey="cost" fill="#82ca9d" />
                </RechartsBarChart>
              </ChartWrapper>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Type Distribution</CardTitle>
              <CardDescription>Breakdown of tasks by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartWrapper>
                <PieChart>
                  <Pie
                    data={getTaskDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getTaskDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartWrapper>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Transaction Logs</CardTitle>
              <CardDescription>Recent cost entries in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Agent</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="p-3 text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm">{log.agent_id}</td>
                        <td className="p-3 text-sm font-medium">${log.cost.toFixed(2)}</td>
                        <td className="p-3 text-sm">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Safety Measures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Auto-kill threshold: 2× task cost
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Warning at 80% of budget
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Block new tasks at 100% budget
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Use smaller, focused agent tasks
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Increase ephemeral agent usage
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Optimize input prompts for brevity
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-amber-500" />
              Monitored Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Writer: moderate usage
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Coder: efficient
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                Researcher: high cost - review
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceAI;
