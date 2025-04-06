
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createAgentTask, getAgentById } from "@/lib/supabaseService";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { PlayCircle } from "lucide-react";
import { AGENT_COMMAND_TEMPLATES } from "@/lib/supabaseTypes";
import { cn } from "@/lib/utils";

interface RunAgentButtonProps {
  agentId: string;
  className?: string;
  onSuccess?: () => void;
}

const RunAgentButton = ({ agentId, className, onSuccess }: RunAgentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [command, setCommand] = useState("");

  const handleOpenDialog = async () => {
    try {
      // Get agent to determine role for command suggestions
      const { data: agent } = await getAgentById(agentId);
      if (agent) {
        const role = agent.role || "Default";
        const templates = AGENT_COMMAND_TEMPLATES[role] || AGENT_COMMAND_TEMPLATES.Default;
        
        // If this is the ZapWriter, use the special prompt
        if (agent.id === "zapwriter") {
          setCommand("Write a complete app spec for Zap: a no-code AI webapp builder that builds apps using other AIs. Follow the peace mission and v0.6 Dashboard format.");
        } else {
          setCommand(templates[0] || "");
        }
      }
      setIsOpen(true);
    } catch (error) {
      console.error("Error getting agent:", error);
      toast.error("Failed to prepare agent command");
    }
  };

  const handleRunAgent = async () => {
    if (!command.trim()) {
      toast.error("Please enter a command for the agent");
      return;
    }

    setIsLoading(true);
    try {
      const { data: task, error } = await createAgentTask({
        agent_id: agentId,
        command,
        result: "Task is being processed by the AI...",
        confidence: 0.9,
        status: "processing"
      });

      if (error) throw error;

      toast.success("Agent task created successfully");
      setIsOpen(false);
      
      // Simulate task completion after a delay (in a real system this would be done by the AI)
      setTimeout(async () => {
        // In a production environment, this would call OpenAI/GPT-4
        const mockResult = `Task completed! I've analyzed your request: "${command.substring(0, 50)}..."\n\nHere's my response:\n\n${generateMockResponse(command)}`;
        
        // Update the task with a mock result
        const updatedTask = {
          ...task,
          result: mockResult,
          status: 'success' as const
        };
        
        // In a real implementation, you would update the task in the database here
        toast.info("Agent has completed the task", {
          description: "The result has been saved to memory"
        });
        
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (error) {
      console.error("Error running agent:", error);
      toast.error("Failed to run agent");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a mock response based on the command
  const generateMockResponse = (command: string) => {
    if (command.includes("app spec") || command.includes("Zap")) {
      return `# Zap: No-Code AI Webapp Builder

## Overview
Zap is a revolutionary no-code platform that enables users to build sophisticated web applications by leveraging the power of multiple specialized AI agents.

## Core Features
1. Intuitive drag-and-drop interface
2. Pre-built AI component library
3. Visual workflow designer
4. Integrated testing and deployment
5. AI-powered assistance for design and functionality

## User Journey
1. User describes their app idea in natural language
2. ZapWriter converts the description into a detailed specification
3. Builder Agent constructs the frontend and backend components
4. Tester Agent validates functionality across different scenarios
5. Admin Agent handles deployment and monitoring

## Technical Architecture
- Frontend: React.js with Tailwind CSS
- Backend: Serverless functions with database integration
- AI Layer: Multiple specialized agents with different capabilities
- Deployment: One-click publishing to various hosting platforms

## Mission Alignment
Zap aligns with our peace mission by democratizing app creation and fostering innovation without requiring technical expertise.`;
    } else if (command.includes("test")) {
      return "Testing completed successfully. All core functionalities are working as expected. Some minor UI improvements are suggested for better user experience.";
    } else if (command.includes("deploy")) {
      return "Deployment completed. The application is now live at https://zap-demo.vercel.app";
    } else {
      return "Task completed successfully. The requested actions have been performed according to specifications.";
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        variant="default"
        className={cn("gap-2", className)}
      >
        <PlayCircle className="h-4 w-4" />
        Run Agent Now
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Run Agent</DialogTitle>
            <DialogDescription>
              Enter a command for the agent to execute. The agent will process this and return a result.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command for agent..."
              className="min-h-[120px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleRunAgent} disabled={isLoading}>
              {isLoading ? "Running..." : "Run Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RunAgentButton;
