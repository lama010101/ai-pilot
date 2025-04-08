
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { useSavedPrompts, SavedPrompt } from '@/hooks/useSavedPrompts';

interface SavedPromptsListProps {
  onSelectPrompt: (text: string) => void;
}

const SavedPromptsList: React.FC<SavedPromptsListProps> = ({ onSelectPrompt }) => {
  const { savedPrompts, removePrompt, clearAllPrompts, getSortedPrompts } = useSavedPrompts();
  
  if (savedPrompts.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>No saved prompts yet. Generated prompts will appear here.</p>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Saved Prompts ({savedPrompts.length})</h3>
        {savedPrompts.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearAllPrompts}
          >
            Clear All
          </Button>
        )}
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {getSortedPrompts().map((prompt) => (
          <Card 
            key={prompt.id} 
            className="hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <CardContent className="p-3 flex justify-between items-start">
              <div 
                className="flex-1 mr-2" 
                onClick={() => onSelectPrompt(prompt.text)}
              >
                <p className="text-sm line-clamp-2">{prompt.text}</p>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(prompt.timestamp)}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removePrompt(prompt.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SavedPromptsList;
