
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Send, Download, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WriterPromptEntry, WriterResponse, ImageGenerationResponse } from '@/types/supabase';

interface WriterPromptGeneratorProps {
  onPromptsGenerated?: (prompts: WriterPromptEntry[]) => void;
  onImageGenerated?: (response: ImageGenerationResponse) => void;
  addToLog?: (message: string) => void;
}

const WriterPromptGenerator: React.FC<WriterPromptGeneratorProps> = ({ 
  onPromptsGenerated, 
  onImageGenerated,
  addToLog = () => {} 
}) => {
  const [instructions, setInstructions] = useState('');
  const [promptCount, setPromptCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<WriterPromptEntry[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);

  const handleSubmitInstructions = async () => {
    if (!instructions) {
      addToLog("❌ Please enter instructions for the Writer Agent");
      return;
    }

    setIsGenerating(true);
    addToLog(`Sending instructions to Writer Agent: "${instructions}"`);

    try {
      const { data, error } = await supabase.functions.invoke('writer-agent', {
        body: { 
          instructions,
          count: promptCount
        }
      });

      if (error) {
        addToLog(`❌ Error from Writer Agent: ${error.message}`);
        throw error;
      }

      const response = data as WriterResponse;
      
      if (response.status === 'error') {
        addToLog(`❌ Writer Agent error: ${response.error || 'Unknown error'}`);
        throw new Error(response.error || 'Unknown error');
      }

      // Add selected property to each prompt
      const promptsWithSelection = response.entries.map(entry => ({
        ...entry,
        selected: true
      }));

      setGeneratedPrompts(promptsWithSelection);
      addToLog(`✅ Generated ${promptsWithSelection.length} prompts successfully`);
      
      if (onPromptsGenerated) {
        onPromptsGenerated(promptsWithSelection);
      }

    } catch (error: any) {
      console.error('Error generating prompts:', error);
      addToLog(`❌ Failed to generate prompts: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePromptSelection = (index: number) => {
    setGeneratedPrompts(prevPrompts => 
      prevPrompts.map((prompt, i) => 
        i === index ? { ...prompt, selected: !prompt.selected } : prompt
      )
    );
  };

  const handleGenerateSelectedImages = async () => {
    const selectedPrompts = generatedPrompts.filter(prompt => prompt.selected);
    
    if (selectedPrompts.length === 0) {
      addToLog("❌ No prompts selected for image generation");
      return;
    }

    setIsGeneratingImages(true);
    addToLog(`Starting generation of ${selectedPrompts.length} images...`);
    
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < selectedPrompts.length; i++) {
      const prompt = selectedPrompts[i];
      setCurrentImageIndex(i);
      
      addToLog(`Generating image ${i + 1}/${selectedPrompts.length}: "${prompt.title}"`);
      
      try {
        const { data, error } = await supabase.functions.invoke('image-generator', {
          body: { 
            manualPrompt: prompt.prompt,
            autoMode: false,
            source: 'dalle',
            metadata: {
              title: prompt.title,
              description: prompt.detailed_description,
              short_description: prompt.short_description,
              year: prompt.year,
              date: prompt.date,
              address: prompt.address,
              gps: prompt.gps,
              country: prompt.country,
              hints: prompt.hints,
              is_true_event: false,
              is_ai_generated: true,
              ready_for_game: true,
              source: 'writer',
              manual_override: true
            }
          }
        });

        if (error) {
          addToLog(`❌ Error generating image for "${prompt.title}": ${error.message}`);
          failureCount++;
          continue;
        }

        const response = data as ImageGenerationResponse;
        addToLog(`✅ Successfully generated image for "${prompt.title}"`);
        successCount++;
        
        if (onImageGenerated) {
          onImageGenerated(response);
        }

      } catch (error: any) {
        console.error('Error generating image:', error);
        addToLog(`❌ Failed to generate image: ${error.message}`);
        failureCount++;
      }
    }

    addToLog(`🎉 Image generation complete: ${successCount} success, ${failureCount} failed`);
    setCurrentImageIndex(null);
    setIsGeneratingImages(false);
  };

  const exportPromptsToCsv = () => {
    if (generatedPrompts.length === 0) return;
    
    const headers = ['title', 'prompt', 'short_description', 'detailed_description', 'hint_1', 'hint_2', 'year', 'address', 'country', 'latitude', 'longitude'];
    
    const csvRows = [
      headers.join(','),
      ...generatedPrompts.map(prompt => {
        const values = [
          `"${prompt.title.replace(/"/g, '""')}"`,
          `"${prompt.prompt.replace(/"/g, '""')}"`,
          `"${prompt.short_description.replace(/"/g, '""')}"`,
          `"${prompt.detailed_description.replace(/"/g, '""')}"`,
          `"${prompt.hints.hint_1.replace(/"/g, '""')}"`,
          `"${prompt.hints.hint_2.replace(/"/g, '""')}"`,
          prompt.year,
          `"${prompt.address?.replace(/"/g, '""') || ''}"`,
          `"${prompt.country.replace(/"/g, '""')}"`,
          prompt.gps.lat,
          prompt.gps.lng
        ];
        return values.join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `writer_prompts_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
    
    URL.revokeObjectURL(url);
    addToLog(`📋 Exported ${generatedPrompts.length} prompts to CSV`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Enter instructions for the Writer Agent (e.g., 'Generate 5 medieval battles in cinematic style, 9:16 ratio')"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="min-h-[100px]"
          disabled={isGenerating}
        />
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Number of prompts:</span>
            <Input
              type="number"
              min={1}
              max={10}
              value={promptCount}
              onChange={(e) => setPromptCount(parseInt(e.target.value) || 5)}
              className="w-16"
              disabled={isGenerating}
            />
          </div>
          
          <Button 
            onClick={handleSubmitInstructions} 
            disabled={isGenerating || !instructions}
            className="ml-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                ✍️ Generate Prompts
              </>
            )}
          </Button>
        </div>
      </div>
      
      {generatedPrompts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Generated Prompts ({generatedPrompts.length})</h3>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all"
                checked={generatedPrompts.every(p => p.selected)}
                onCheckedChange={(checked) => {
                  setGeneratedPrompts(prevPrompts => 
                    prevPrompts.map(p => ({ ...p, selected: !!checked }))
                  );
                }}
              />
              <label htmlFor="select-all" className="text-sm">Select All</label>
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {generatedPrompts.map((prompt, index) => (
              <Card key={index} className={`border ${prompt.selected ? 'border-primary' : 'border-muted'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-semibold text-lg">{prompt.title}</h4>
                        <Checkbox 
                          checked={prompt.selected}
                          onCheckedChange={() => togglePromptSelection(index)}
                        />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{prompt.short_description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {prompt.year}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {prompt.country}
                        </Badge>
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="text-sm font-medium mb-1">Prompt:</h5>
                        <p className="text-sm border border-muted p-2 rounded-md bg-muted/30">{prompt.prompt}</p>
                      </div>
                      
                      {currentImageIndex === index && isGeneratingImages && (
                        <div className="flex items-center text-sm text-amber-500 mt-2">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating image...
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              onClick={handleGenerateSelectedImages}
              disabled={isGeneratingImages || generatedPrompts.filter(p => p.selected).length === 0}
              className="flex-1"
            >
              {isGeneratingImages ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Images...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Selected Images
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={exportPromptsToCsv}
              disabled={isGeneratingImages || generatedPrompts.length === 0}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriterPromptGenerator;
