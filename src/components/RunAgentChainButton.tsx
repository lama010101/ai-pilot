
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createAgentTask, getAgentById, getAgentChain } from "@/lib/supabaseService";
import { toast } from "sonner";
import { PlayCircle } from "lucide-react";
import { AgentTaskDB } from "@/lib/supabaseTypes";

interface RunAgentChainButtonProps {
  parentTaskId: string;
  onSuccess?: () => void;
}

const RunAgentChainButton = ({ parentTaskId, onSuccess }: RunAgentChainButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [chainTasks, setChainTasks] = useState<AgentTaskDB[]>([]);

  const handleOpenDialog = async () => {
    try {
      // Get the full agent chain
      const { data: chain } = await getAgentChain(parentTaskId);
      if (chain && chain.length > 0) {
        setChainTasks(chain);
        setIsOpen(true);
      } else {
        toast.error("No agent chain found for this task");
      }
    } catch (error) {
      console.error("Error getting agent chain:", error);
      toast.error("Failed to prepare agent chain");
    }
  };

  const runNextAgent = async () => {
    if (currentStep >= chainTasks.length) {
      toast.success("All agents in the chain have been executed");
      setIsOpen(false);
      return;
    }

    const currentTask = chainTasks[currentStep];
    
    // Skip the parent task (already completed)
    if (currentStep === 0 && currentTask.id === parentTaskId) {
      setCurrentStep(1);
      if (chainTasks.length <= 1) {
        toast.info("No additional agents to run in this chain");
        setIsOpen(false);
        return;
      }
      runNextAgent();
      return;
    }

    setIsLoading(true);
    try {
      // Get the agent details
      const { data: agent } = await getAgentById(currentTask.agent_id);
      
      if (!agent) {
        throw new Error(`Agent ${currentTask.agent_id} not found`);
      }

      toast.info(`Running ${agent.name}...`);
      
      // In a real implementation, this would actually run the agent with the LLM
      // Simulate agent running for demo purposes
      setTimeout(() => {
        // Update the task locally to show it's completed
        const updatedChainTasks = [...chainTasks];
        updatedChainTasks[currentStep] = {
          ...currentTask,
          status: 'success',
          result: `Task executed by ${agent.name}. The ${agent.role} has completed their work.`
        };
        
        setChainTasks(updatedChainTasks);
        setCurrentStep(currentStep + 1);
        
        toast.success(`${agent.name} completed successfully`);
        
        // If there are more agents to run, continue
        if (currentStep + 1 < chainTasks.length) {
          runNextAgent();
        } else {
          toast.success("All agents in the chain have been executed");
          setIsLoading(false);
          setIsOpen(false);
          if (onSuccess) onSuccess();
        }
      }, 2000);
    } catch (error) {
      console.error("Error running agent:", error);
      toast.error("Failed to run agent in chain");
      setIsLoading(false);
    }
  };

  const handleRunChain = async () => {
    setCurrentStep(0);
    runNextAgent();
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        variant="default"
        className="gap-2"
      >
        <PlayCircle className="h-4 w-4" />
        Run Agent Chain
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Run Agent Chain</DialogTitle>
            <DialogDescription>
              This will execute all agents in the chain sequentially.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              {chainTasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    currentStep > index ? "bg-green-100 text-green-700" :
                    currentStep === index ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {currentStep > index ? "✓" : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{task.agent_id}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {task.command.substring(0, 60)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleRunChain} disabled={isLoading}>
              {isLoading ? "Running..." : "Run Chain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RunAgentChainButton;
