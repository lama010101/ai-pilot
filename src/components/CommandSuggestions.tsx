
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { AGENT_COMMAND_TEMPLATES } from "@/lib/supabaseTypes";
import { cn } from "@/lib/utils";

interface CommandSuggestionsProps {
  agentType: string;
  onSelectCommand: (command: string) => void;
}

const CommandSuggestions = ({ agentType, onSelectCommand }: CommandSuggestionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get the appropriate command list for this agent type
  const commands = AGENT_COMMAND_TEMPLATES[agentType] || AGENT_COMMAND_TEMPLATES.Default;
  
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
                <Button
                  key={idx}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3 text-left font-normal"
                  onClick={() => {
                    onSelectCommand(command);
                    setIsOpen(false);
                  }}
                >
                  {command}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandSuggestions;
