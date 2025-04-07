
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Wand2, Clipboard, Loader2, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageGenerationResponse } from "@/types/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImageGeneratorUIProps {
  onImageGenerated?: (response: ImageGenerationResponse) => void;
}

const ImageGeneratorUI: React.FC<ImageGeneratorUIProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageGenerationResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('input');
  const { toast } = useToast();

  const generateImage = useCallback(async () => {
    if (!prompt && !isAutoMode) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt or enable auto-generation mode",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      setLogs([`${new Date().toLocaleTimeString()} - Starting image generation...`]);
      setActiveTab('logs');

      const response = await supabase.functions.invoke('image-generator', {
        body: {
          manualPrompt: prompt,
          autoMode: isAutoMode,
          source: 'dalle' // Currently only supporting DALL-E
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate image");
      }

      const data = response.data as ImageGenerationResponse;
      setLogs(data.logs.map(log => log.split(' - ')[1]));
      setGeneratedImage(data);
      setActiveTab('preview');
      
      toast({
        title: "Image generated",
        description: "Successfully generated image from prompt",
      });
      
      if (onImageGenerated) {
        onImageGenerated(data);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setLogs(prev => [...prev, `ERROR: ${error.message}`]);
      
      toast({
        title: "Generation failed",
        description: error.message || "There was an error generating the image",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isAutoMode, toast, onImageGenerated]);

  const copyPrompt = useCallback(() => {
    if (generatedImage?.promptUsed) {
      navigator.clipboard.writeText(generatedImage.promptUsed);
      toast({
        title: "Prompt copied",
        description: "The prompt has been copied to your clipboard",
      });
    }
  }, [generatedImage, toast]);

  const refreshPrompt = useCallback(() => {
    // For now, this just clears the current prompt
    setPrompt('');
    setGeneratedImage(null);
    setActiveTab('input');
    setLogs([]);
    
    toast({
      title: "Reset",
      description: "Prompt and generated image have been cleared",
    });
  }, [toast]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          <span>AI Image Generator</span>
        </CardTitle>
        <CardDescription>
          Generate AI images for historical events using DALL-E
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedImage}>Preview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-mode"
                checked={isAutoMode}
                onCheckedChange={setIsAutoMode}
              />
              <Label htmlFor="auto-mode">Auto-generate prompt (Writer Agent)</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">Event Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe a historical event (e.g., 'The moon landing in 1969')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isAutoMode || isGenerating}
                className="min-h-[120px] resize-y"
              />
              <p className="text-sm text-muted-foreground">
                Be specific about the event, date, and location for best results
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={generateImage}
                disabled={isGenerating || (!prompt && !isAutoMode)}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={refreshPrompt}
                disabled={isGenerating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            {generatedImage ? (
              <>
                <div className="aspect-square overflow-hidden rounded-md bg-muted flex items-center justify-center">
                  {generatedImage.imageUrl ? (
                    <img
                      src={generatedImage.imageUrl}
                      alt={generatedImage.metadata.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Prompt Used</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyPrompt}
                        className="h-8 w-8 p-0"
                      >
                        <Clipboard className="h-4 w-4" />
                        <span className="sr-only">Copy prompt</span>
                      </Button>
                    </div>
                    <p className="mt-1 text-sm">{generatedImage.promptUsed}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <p className="mt-1 text-sm">{generatedImage.metadata.title}</p>
                    </div>
                    
                    <div>
                      <Label>Year/Date</Label>
                      <p className="mt-1 text-sm">
                        {generatedImage.metadata.date || generatedImage.metadata.year || 'Unknown'}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Location</Label>
                      <p className="mt-1 text-sm">
                        {generatedImage.metadata.address || 'Unknown'}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Source</Label>
                      <p className="mt-1 text-sm capitalize">
                        {generatedImage.metadata.source}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium">No image generated yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate an image to see the preview
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="space-y-2">
              <Label>Generation Logs</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {logs.length > 0 ? (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log, index) => (
                      <div key={index} className="py-0.5">
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No logs available
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImageGeneratorUI;
