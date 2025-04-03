
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { agents, Agent } from '@/data/agents';

interface Log {
  id: string;
  timestamp: string;
  message: string;
}

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | undefined>();
  const [logs, setLogs] = useState<Log[]>([
    { id: '1', timestamp: '5 mins ago', message: 'Agent initialized' },
    { id: '2', timestamp: '4 mins ago', message: 'Received task assignment' }
  ]);
  const [command, setCommand] = useState('');

  useEffect(() => {
    const foundAgent = agents.find(a => a.id === id);
    if (foundAgent) {
      setAgent(foundAgent);
    } else {
      navigate('/dashboard');
    }
  }, [id, navigate]);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const handleSimulateTask = () => {
    const newLog: Log = {
      id: Date.now().toString(),
      timestamp: 'Just now',
      message: `Starting task: ${agent.currentTask || 'System analysis'}`
    };
    setLogs([newLog, ...logs]);
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const newLog: Log = {
      id: Date.now().toString(),
      timestamp: 'Just now',
      message: `🧠 Received command: '${command}'`
    };
    setLogs([newLog, ...logs]);
    setCommand('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${
            agent.status === 'running' ? 'bg-green-500' : 
            agent.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
          }`}></span>
          <span className="text-sm">
            {agent.status === 'running' ? 'Running' : 
             agent.status === 'error' ? 'Error' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Task</CardTitle>
            <CardDescription>What this agent is working on</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{agent.currentTask || 'No active task'}</p>
            <Button 
              onClick={handleSimulateTask} 
              className="mt-4"
              variant="secondary"
            >
              Simulate Task
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Command</CardTitle>
            <CardDescription>Issue a direct command to the agent</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendCommand} className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Logs</CardTitle>
          <CardDescription>Recent activity and communication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 pb-4 border-b last:border-0">
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
    </div>
  );
};

export default AgentDetail;
