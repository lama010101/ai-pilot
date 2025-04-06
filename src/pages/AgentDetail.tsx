
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, StopCircle } from 'lucide-react';
import { getAgentById } from '@/lib/supabase/agentService';
import { AgentDB } from '@/lib/supabaseTypes';
import RunAgentButton from '@/components/RunAgentButton';
import AgentFeedback from '@/components/AgentFeedback';
import FeedbackSummary from '@/components/FeedbackSummary';
import { Timeline, TimelineItem } from '@/components/Timeline';
import AgentSpecViewer from '@/components/AgentSpecViewer';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) return;
      
      setIsLoading(true);
      const { data, error } = await getAgentById(id);
      
      if (error || !data) {
        console.error("Error fetching agent:", error);
        navigate('/dashboard/agents');
        return;
      }
      
      setAgent(data);
      setIsLoading(false);
    };
    
    fetchAgent();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  // Special handling for Image Agent
  const isImageAgent = agent.id === 'image-agent';

  return (
    <>
      <Helmet>
        <title>{agent.name} | Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard/agents')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">
              {agent.role}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Agent Controls</CardTitle>
              <CardDescription>
                Manage and execute this agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Status</span>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span>Active</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Phase</span>
                <span>Phase {agent.phase || 1}</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Last Active</span>
                <span>{new Date(agent.last_updated).toLocaleString()}</span>
              </div>
              
              {isImageAgent ? (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => navigate('/dashboard/images')}
                >
                  Go to Image Processing
                </Button>
              ) : (
                <div className="space-y-2 mt-4">
                  <RunAgentButton agentId={agent.id} variant="default" size="default" className="w-full" />
                  <Button variant="outline" className="w-full" disabled>
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Agent
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Tabs defaultValue="activity">
              <TabsList>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="spec">Specification</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="space-y-4">
                <div>
                  {agent.id && (
                    <div className="space-y-4">
                      <TimelineItem>
                        <TimelineItem.Indicator>
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </TimelineItem.Indicator>
                        <TimelineItem.Content>
                          <div className="font-medium">Agent created</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(agent.created_at || Date.now()).toLocaleString()}
                          </div>
                        </TimelineItem.Content>
                      </TimelineItem>
                      
                      <TimelineItem>
                        <TimelineItem.Indicator>
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </TimelineItem.Indicator>
                        <TimelineItem.Content>
                          <div className="font-medium">Last updated</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(agent.last_updated || Date.now()).toLocaleString()}
                          </div>
                        </TimelineItem.Content>
                      </TimelineItem>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="space-y-4">
                <FeedbackSummary agentId={agent.id} />
                <AgentFeedback agentId={agent.id} taskId="" />
              </TabsContent>
              
              <TabsContent value="spec" className="space-y-4">
                <AgentSpecViewer agentId={agent.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentDetail;
