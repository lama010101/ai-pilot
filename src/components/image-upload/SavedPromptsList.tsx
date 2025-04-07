
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash, Save, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedPrompt } from '@/hooks/useSavedPrompts';

interface SavedPromptsListProps {
  prompts: SavedPrompt[];
  onSelectPrompt: (prompt: string) => void;
  onRemovePrompt: (id: string) => void;
  onClearAll?: () => void;
}

const SavedPromptsList: React.FC<SavedPromptsListProps> = ({
  prompts,
  onSelectPrompt,
  onRemovePrompt,
  onClearAll
}) => {
  if (prompts.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="p-4 text-center text-muted-foreground">
          <div className="flex flex-col items-center py-4">
            <Save className="h-8 w-8 mb-2 opacity-30" />
            <p>No saved prompts yet</p>
            <p className="text-sm">Your prompts will appear here after generation</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Saved Prompts</p>
          {prompts.length > 0 && onClearAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[200px] pr-2">
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <div 
                key={prompt.id} 
                className="group relative border rounded-md p-2 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => onSelectPrompt(prompt.text)}
              >
                <p className="text-sm line-clamp-2 pr-8">{prompt.text}</p>
                
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{new Date(prompt.timestamp).toLocaleString()}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePrompt(prompt.id);
                  }}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SavedPromptsList;
