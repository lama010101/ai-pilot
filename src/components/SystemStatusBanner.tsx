
import { useEffect, useState } from 'react';
import { getSystemStatus, getAgents } from '@/lib/supabaseService';
import { SystemStatusDB } from '@/lib/supabaseTypes';
import { AlertCircle, Clock, Users } from 'lucide-react';

const SystemStatusBanner = () => {
  const [status, setStatus] = useState<SystemStatusDB[]>([]);
  const [agentCount, setAgentCount] = useState(0);
  const [uptime, setUptime] = useState('00:00:00');
  const [loading, setLoading] = useState(true);

  // Simulated uptime counter
  useEffect(() => {
    // Start with a random number of hours (1-24) for the fake uptime
    const startHours = Math.floor(Math.random() * 24) + 1;
    const startMinutes = Math.floor(Math.random() * 60);
    const startSeconds = Math.floor(Math.random() * 60);
    
    let seconds = startSeconds;
    let minutes = startMinutes;
    let hours = startHours;
    
    const interval = setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
        }
      }
      
      setUptime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch agent count and system status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: statusData } = await getSystemStatus();
        if (statusData) {
          setStatus(statusData);
        }
        
        const { data: agentsData } = await getAgents();
        if (agentsData) {
          // Count non-ephemeral agents
          setAgentCount(agentsData.filter(agent => !agent.is_ephemeral).length);
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (loading) {
    return (
      <div className="bg-muted/30 h-10 animate-pulse rounded-md px-4"></div>
    );
  }

  // Get the most recent status message
  const latestStatus = status.length > 0 ? status[0] : null;
  
  return (
    <div className={`flex items-center justify-between px-4 py-2 text-sm rounded-md ${
      latestStatus?.severity === 'error' 
        ? 'bg-red-100 text-red-800' 
        : latestStatus?.severity === 'warning'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-blue-50 text-blue-800'
    }`}>
      <div className="flex items-center space-x-6">
        <div className="flex items-center gap-1.5">
          <Clock size={16} />
          <span>Uptime: {uptime}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Users size={16} />
          <span>Agents Online: {agentCount}</span>
        </div>
      </div>
      
      {latestStatus && (
        <div className="flex items-center gap-1.5">
          <AlertCircle size={16} className={latestStatus.severity === 'error' ? 'text-red-600' : latestStatus.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'} />
          <span>{latestStatus.message}</span>
        </div>
      )}
    </div>
  );
};

export default SystemStatusBanner;
