
import React, { useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon, Wand2, Clipboard, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageGenerationResponse } from "@/types/supabase";
import SavedPromptsList from './SavedPromptsList';
import useSavedPrompts from '@/hooks/useSavedPrompts';
import { useImageProviderStore, ImageProvider } from '@/stores/imageProviderStore';

interface ImageGeneratorUIProps {
  onImageGenerated?: (response: ImageGenerationResponse) => void;
  addToLog?: (message: string) => void;
  suppressHeader?: boolean;
}

const ImageGeneratorUI: React.FC<ImageGeneratorUIProps> = ({ 
  onImageGenerated,
  addToLog = () => {},
  suppressHeader = false 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageGenerationResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('manual');
  
  const { savedPrompts, savePrompt } = useSavedPrompts();
  const { provider, setProvider } = useImageProviderStore();
  
  const addLogMessage = (message: string) => {
    const logEntry = `${new Date().toLocaleTimeString()} - ${message}`;
    setLogs(prev => [...prev, logEntry]);
    addToLog(message);
  };

  const generateImage = useCallback(async () => {
    if (!prompt && !isAutoMode) {
      toast.error("Please enter a prompt or enable auto-generation mode");
      return;
    }

    try {
      setIsGenerating(true);
      addLogMessage(`Starting image generation with ${provider.toUpperCase()}...`);
      setActiveTab('logs');

      if (prompt.trim()) {
        savePrompt(prompt);
      }

      const response = await supabase.functions.invoke('image-generator', {
        body: {
          manualPrompt: prompt,
          autoMode: isAutoMode,
          source: provider,
          mode: 'manual'
        }
      });

      if (response.error) {
        addLogMessage(`❌ Error: ${response.error.message || "Edge Function error"}`);
        throw new Error(response.error.message || "Failed to generate image");
      }

      const data = response.data as ImageGenerationResponse;
      
      if (data.error) {
        addLogMessage(`❌ Error: ${data.error}`);
        throw new Error(data.error);
      }
      
      // Add logs from the response
      if (data.logs && data.logs.length > 0) {
        data.logs.forEach(log => {
          const parts = log.split(' - ');
          addLogMessage(parts.length > 1 ? parts[1] : log);
        });
      }
      
      setGeneratedImage(data);
      setActiveTab('preview');
      
      addLogMessage(`✅ Image generated successfully with ${provider.toUpperCase()}: ${data.imageUrl}`);
      
      toast.success(`Successfully generated image from prompt using ${provider.toUpperCase()}`);
      
      if (onImageGenerated) {
        onImageGenerated(data);
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      addLogMessage(`❌ ERROR: ${error.message}`);
      
      toast.error(error.message || "There was an error generating the image");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isAutoMode, provider, savePrompt, onImageGenerated, addToLog]);

  const copyPrompt = useCallback(() => {
    if (generatedImage?.promptUsed) {
      navigator.clipboard.writeText(generatedImage.promptUsed);
      toast.success("The prompt has been copied to your clipboard");
    }
  }, [generatedImage]);

  const refreshPrompt = useCallback(() => {
    setPrompt('');
    setGeneratedImage(null);
    setActiveTab('manual');
    setLogs([]);
    
    toast.success("Prompt and generated image have been cleared");
  }, []);

  const providerOptions: { value: ImageProvider; label: string }[] = [
    { value: 'dalle', label: 'DALL·E' },
    { value: 'midjourney', label: 'Midjourney' },
    { value: 'vertex', label: 'Vertex AI' }
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedImage}>Preview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-select">Image Provider</Label>
              <Select
                value={provider}
                onValueChange={(value: ImageProvider) => setProvider(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select image provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select which AI provider to use for image generation
              </p>
            </div>
            
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
            
            <SavedPromptsList 
              onSelectPrompt={(text) => setPrompt(text)}
            />
            
            <div className="space-y-4">
              <Button
                onClick={generateImage}
                disabled={isGenerating || (!prompt && !isAutoMode)}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating with {providerOptions.find(p => p.value === provider)?.label}...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Image with {providerOptions.find(p => p.value === provider)?.label}
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          {generatedImage ? (
            <>
              <div className="aspect-square overflow-hidden rounded-md bg-muted flex items-center justify-center">
                {generatedImage.imageUrl ? (
                  <img
                    src={generatedImage.imageUrl}
                    alt={generatedImage.metadata.title || "Generated image"}
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
                    <p className="mt-1 text-sm">{generatedImage.metadata.title || "Untitled"}</p>
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
                      {generatedImage.metadata.location || generatedImage.metadata.address || 'Unknown'}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Provider</Label>
                    <p className="mt-1 text-sm">
                      <Badge variant="outline">
                        {generatedImage.metadata.source === 'dalle' ? 'DALL·E' :
                         generatedImage.metadata.source === 'midjourney' ? 'Midjourney' :
                         generatedImage.metadata.source === 'vertex' ? 'Vertex AI' :
                         generatedImage.metadata.source || provider}
                      </Badge>
                    </p>
                  </div>
                  
                  {generatedImage.metadata.gps && (
                    <div className="col-span-2">
                      <Label>GPS Coordinates</Label>
                      <p className="mt-1 text-sm font-mono">
                        {generatedImage.metadata.gps.lat}, {generatedImage.metadata.gps.lng}
                      </p>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={refreshPrompt}
                  className="w-full mt-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear & Generate New Image
                </Button>
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
                    <div key={index} className={`py-0.5 ${log.includes('ERROR') || log.includes('❌') ? 'text-red-500' : log.includes('Success') || log.includes('✅') ? 'text-green-500' : ''}`}>
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
    </div>
  );
};

export default ImageGeneratorUI;
