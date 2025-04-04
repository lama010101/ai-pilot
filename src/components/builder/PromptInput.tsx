
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlayCircle, Loader2, AlertCircle } from 'lucide-react';

interface PromptInputProps {
  isProcessing: boolean;
  currentStep: number;
  steps: string[];
  onSubmit: (prompt: string) => void;
  initialValue?: string;
  buildError?: string | null;
}

const PromptInput: React.FC<PromptInputProps> = ({ 
  isProcessing, 
  currentStep, 
  steps, 
  onSubmit,
  initialValue = '',
  buildError = null
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
        
        {buildError && (
          <div className="mt-2 flex items-start gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{buildError}</span>
          </div>
        )}
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
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Building...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Build App
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PromptInput;
