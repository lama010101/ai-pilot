import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentFeedback } from '@/lib/supabaseService';
import { AgentFeedbackDB } from '@/lib/supabaseTypes';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackSummaryProps {
  agentId?: string;
  feedback?: AgentFeedbackDB[];
  loading?: boolean;
}

const FeedbackSummary = ({ agentId, feedback: propsFeedback, loading: propsLoading }: FeedbackSummaryProps) => {
  const [feedback, setFeedback] = useState<AgentFeedbackDB[]>(propsFeedback || []);
  const [isLoading, setIsLoading] = useState(propsLoading !== undefined ? propsLoading : true);

  useEffect(() => {
    if (propsFeedback) {
      setFeedback(propsFeedback);
      setIsLoading(false);
      return;
    }
    
    if (agentId) {
      const fetchFeedback = async () => {
        try {
          const { data, error } = await getAgentFeedback(agentId);
          if (!error && data) {
            setFeedback(data);
          }
        } catch (error) {
          console.error("Error fetching feedback:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchFeedback();
    }
  }, [agentId, propsFeedback]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const totalFeedback = feedback.length;
  const positiveFeedback = feedback.filter(f => f.rating > 0).length;
  const negativeFeedback = feedback.filter(f => f.rating === 0).length;
  const averageScore = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;
  
  const scoreColor = 
    averageScore >= 70 ? 'text-green-600' :
    averageScore >= 40 ? 'text-amber-600' :
    'text-red-600';

  const latestComments = feedback
    .filter(f => f.comment && f.comment.trim() !== '')
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Summary</CardTitle>
        <CardDescription>User ratings and comments for this agent</CardDescription>
      </CardHeader>
      <CardContent>
        {totalFeedback > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalFeedback}</div>
                <p className="text-sm text-muted-foreground">Total Ratings</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${scoreColor}`}>{averageScore.toFixed(0)}%</div>
                <p className="text-sm text-muted-foreground">Positive</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <ThumbsUp className={`h-5 w-5 ${averageScore >= 50 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <ThumbsDown className={`h-5 w-5 ${averageScore < 50 ? 'text-red-500' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-sm text-muted-foreground">Sentiment</p>
              </div>
            </div>
            
            {latestComments.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Latest Comments</h3>
                <div className="space-y-3">
                  {latestComments.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      {item.rating > 0 ? (
                        <ThumbsUp className="h-4 w-4 mt-1 text-green-500" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 mt-1 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{item.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No feedback has been collected yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackSummary;
