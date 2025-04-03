
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { AGENT_COMMAND_TEMPLATES } from "@/lib/supabaseTypes";
import { cn } from "@/lib/utils";
import { calculateTaskCost } from "@/lib/supabaseService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CommandSuggestionsProps {
  agentRole: string;  // Changed from agentType to agentRole to match AgentDetail usage
  onSelect: (command: string) => void;  // Changed to match the onSelect from AgentDetail
}

const CommandSuggestions = ({ agentRole, onSelect }: CommandSuggestionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get the appropriate command list for this agent type/role
  const commands = AGENT_COMMAND_TEMPLATES[agentRole] || AGENT_COMMAND_TEMPLATES.Default;
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="w-full flex justify-between items-center mb-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Lightbulb className="mr-2 h-4 w-4" />
          Command Templates
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      
      <Card className={cn(
        "absolute z-10 w-full transition-all duration-200 overflow-hidden",
        isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <CardContent className="p-2">
          <ScrollArea className="h-60 rounded-md">
            <div className="space-y-2 p-2">
              {commands.map((command, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3 text-left font-normal"
                        onClick={() => {
                          onSelect(command);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <span>{command}</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            Est. Cost: ${calculateTaskCost(command).toFixed(2)}
                          </span>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select this command template</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandSuggestions;
