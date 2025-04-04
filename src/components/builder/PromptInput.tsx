
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlayCircle, Loader2 } from 'lucide-react';

interface PromptInputProps {
  isProcessing: boolean;
  currentStep: number;
  steps: string[];
  onSubmit: (prompt: string) => void;
  initialValue?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ 
  isProcessing, 
  currentStep, 
  steps, 
  onSubmit,
  initialValue = ''
}) => {
  const [prompt, setPrompt] = useState<string>(initialValue);
  
  // Update prompt when initialValue changes (for remixing)
  useEffect(() => {
    if (initialValue) {
      setPrompt(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New App</CardTitle>
        <CardDescription>
          Describe the app you want to build in plain English
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="e.g., Build a to-do app with tasks and tags, dark mode support, and user authentication"
          className="min-h-[120px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isProcessing}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {isProcessing && (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin h-4 w-4" />
              <span>{steps[currentStep]}</span>
            </div>
          )}
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={isProcessing || !prompt.trim()}
          className="flex items-center gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          {isProcessing ? 'Building...' : 'Build App'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PromptInput;
