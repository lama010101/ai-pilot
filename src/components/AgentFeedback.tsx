
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createAgentFeedback } from "@/lib/supabaseService";
import { toast } from "sonner";

interface AgentFeedbackProps {
  agentId: string;
  taskId: string;
  onFeedbackSubmitted?: () => void;
}

const AgentFeedback = ({ agentId, taskId, onFeedbackSubmitted }: AgentFeedbackProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === null) {
      toast.warning("Please provide a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAgentFeedback({
        agent_id: agentId,
        task_id: taskId,
        rating,
        comment
      });

      toast.success("Feedback submitted successfully");
      setRating(null);
      setComment('');
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Provide Feedback</CardTitle>
        <CardDescription>Help improve agent performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button
              type="button"
              variant={rating === 1 ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${rating === 1 ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => setRating(1)}
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              Helpful
            </Button>
            <Button
              type="button"
              variant={rating === 0 ? "default" : "outline"}
              size="sm"
              className={`flex-1 ${rating === 0 ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={() => setRating(0)}
            >
              <ThumbsDown className="mr-1 h-4 w-4" />
              Not Helpful
            </Button>
          </div>
          
          <Textarea
            placeholder="Optional comment about this task..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-20"
          />
          
          <Button
            onClick={handleSubmit}
            disabled={rating === null || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                Submitting...
              </>
            ) : 'Submit Feedback'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentFeedback;
