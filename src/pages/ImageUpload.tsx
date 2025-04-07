import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Check, X, Save, FileSpreadsheet, Database, Wand2, Feather } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageUploader from '@/components/image-upload/ImageUploader';
import ImageReviewGrid from '@/components/image-upload/ImageReviewGrid';
import SavedImagesGallery from '@/components/image-upload/SavedImagesGallery';
import ImageGeneratorUI from '@/components/image-upload/ImageGeneratorUI';
import WriterPromptGenerator from '@/components/image-upload/WriterPromptGenerator';
import * as XLSX from 'xlsx';
import { Json } from "@/integrations/supabase/types";
import { ImageGenerationResponse, WriterPromptEntry } from '@/types/supabase';

export interface ProcessedImage {
  originalFileName: string;
  descFileName: string;
  metadata: {
    title: string | null;
    description: string | null;
    date: string | null;
    year: number | null;
    location: string | null;
    gps: { lat: number; lon: number } | null;
    is_true_event: boolean;
    is_ai_generated: boolean;
    is_mature_content?: boolean;
    manual_override?: boolean;
    accuracy_description?: number;
    accuracy_date?: number;
    accuracy_location?: number;
    accuracy_historical?: number;
    accuracy_realness?: number;
    accuracy_maturity?: number;
    source?: string;
  };
  imageUrl: string;
  descriptionImageUrl: string;
  ready_for_game?: boolean;
  selected?: boolean;
}

interface ProjectDb {
  id: string;
  name: string;
  supabaseId: string;
  isConnected: boolean;
}

const ImageUpload = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [processLog, setProcessLog] = useState<string[]>([]);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectDb[]>([
    {
      id: 'guess-history',
      name: 'Guess History',
      supabaseId: 'pbpcegbobdnqqkloousm',
      isConnected: true
    }
  ]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedImages = localStorage.getItem('processedImages');
      if (savedImages) {
        const parsedImages = JSON.parse(savedImages);
        setProcessedImages(parsedImages);
        
        addToLog("Restored previously processed images from localStorage");
      }
      
      const savedLog = localStorage.getItem('processLog');
      if (savedLog) {
        const parsedLog = JSON.parse(savedLog);
        setProcessLog(parsedLog);
      }
    } catch (e) {
      console.warn("Could not load state from localStorage", e);
    }
  }, []);
  
  useEffect(() => {
    if (processedImages.length > 0) {
      try {
        localStorage.setItem('processedImages', JSON.stringify(processedImages));
      } catch (e) {
        console.warn("Could not save processed images to localStorage", e);
      }
    }
  }, [processedImages]);
  
  useEffect(() => {
    if (processLog.length > 0) {
      try {
        localStorage.setItem('processLog', JSON.stringify(processLog));
      } catch (e) {
        console.warn("Could not save process log to localStorage", e);
      }
    }
  }, [processLog]);
  
  const addToLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessLog(prevLog => [...prevLog, `[${timestamp}] ${message}`]);
    
    console.log(`[${timestamp}] ${message}`);
  }, []);

  const processMetadataFile = useCallback(async (file: File) => {
    try {
      addToLog(`Processing metadata file: ${file.name}`);
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      addToLog(`Found ${jsonData.length} metadata entries in Excel file`);
      
      return jsonData;
    } catch (error) {
      console.error("Error processing Excel file:", error);
      addToLog(`ERROR: Failed to process Excel file - ${error.message}`);
      return [];
    }
  }, [addToLog]);
  
  const findMetadataForImage = useCallback((filename: string, metadataArray: any[]) => {
    const baseName = filename.split('.')[0];
    return metadataArray.find(item => {
      return (item.filename && item.filename.includes(baseName)) || 
             (item.id && item.id.includes(baseName)) ||
             (item.file && item.file.includes(baseName));
    });
  }, []);

  const handleUpload = useCallback(async (files: FileList, metadataFile: File | null = null) => {
    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(true);
      addToLog(`Starting upload process for ${files.length} files`);
      
      let metadataEntries: any[] = [];
      if (metadataFile) {
        metadataEntries = await processMetadataFile(metadataFile);
      }
      
      const processedImagesData: ProcessedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          addToLog(`Skipping non-image file: ${file.name}`);
          continue;
        }
        
        addToLog(`Processing image: ${file.name}`);
        
        const imageUrl = URL.createObjectURL(file);
        
        let metadata: ProcessedImage['metadata'] = {
          title: file.name.split('.')[0],
          description: null,
          date: null,
          year: null,
          location: null,
          gps: null,
          is_true_event: false,
          is_ai_generated: false,
          is_mature_content: false,
          manual_override: false,
          accuracy_description: 0,
          accuracy_date: 0,
          accuracy_location: 0,
          accuracy_historical: 0,
          accuracy_realness: 0,
          accuracy_maturity: 0,
        };
        
        if (metadataEntries.length > 0) {
          const matchedMetadata = findMetadataForImage(file.name, metadataEntries);
          if (matchedMetadata) {
            addToLog(`Found metadata match for ${file.name} in Excel file`);
            
            metadata = {
              ...metadata,
              title: matchedMetadata.title || metadata.title,
              description: matchedMetadata.description || metadata.description,
              date: matchedMetadata.date || metadata.date,
              year: matchedMetadata.year ? parseInt(matchedMetadata.year) : metadata.year,
              location: matchedMetadata.location || metadata.location,
              gps: matchedMetadata.gps || (matchedMetadata.latitude && matchedMetadata.longitude 
                ? { lat: parseFloat(matchedMetadata.latitude), lon: parseFloat(matchedMetadata.longitude) } 
                : metadata.gps),
              is_true_event: matchedMetadata.is_historical !== undefined 
                ? !!matchedMetadata.is_historical 
                : metadata.is_true_event,
              is_ai_generated: matchedMetadata.is_ai_generated !== undefined 
                ? !!matchedMetadata.is_ai_generated 
                : metadata.is_ai_generated,
              is_mature_content: matchedMetadata.is_mature_content !== undefined 
                ? !!matchedMetadata.is_mature_content 
                : metadata.is_mature_content,
            };
          }
        }
        
        processedImagesData.push({
          originalFileName: file.name,
          descFileName: `desc_${file.name}`,
          metadata,
          imageUrl,
          descriptionImageUrl: imageUrl,
          ready_for_game: false,
          selected: true
        });
        
        addToLog(`Successfully processed image: ${file.name}`);
      }
      
      setProcessedImages(processedImagesData);
      
      toast({
        title: "Processing complete",
        description: `Successfully processed ${processedImagesData.length} images`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      addToLog(`ERROR: ${error.message || "Unknown upload error"}`);
      
      toast({
        title: "Upload failed",
        description: error.message || "There was an error processing your images",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [toast, addToLog, processMetadataFile, findMetadataForImage]);

  const handleMetadataFileSelect = (file: File | null) => {
    setMetadataFile(file);
    if (file) {
      addToLog(`Selected metadata file: ${file.name}`);
    }
  };

  const toggleSelectAll = useCallback((selected: boolean) => {
    setProcessedImages(prev => 
      prev.map(img => ({ ...img, selected }))
    );
    addToLog(`${selected ? 'Selected' : 'Deselected'} all images`);
  }, [addToLog]);

  const toggleImageSelection = useCallback((index: number, selected: boolean) => {
    setProcessedImages(prev => 
      prev.map((img, i) => i === index ? { ...img, selected } : img)
    );
  }, []);

  const toggleReadyForGame = useCallback((index: number, ready: boolean) => {
    setProcessedImages(prev => 
      prev.map((img, i) => i === index ? { ...img, ready_for_game: ready } : img)
    );
    const imageFileName = processedImages[index]?.originalFileName || `image-${index}`;
    addToLog(`Set image "${imageFileName}" as ${ready ? 'ready' : 'not ready'} for game`);
  }, [processedImages, addToLog]);

  const handleImageMetadataUpdate = useCallback((index: number, metadata: any) => {
    setProcessedImages(prev => 
      prev.map((img, i) => {
        if (i === index) {
          const imageFileName = img.originalFileName || `image-${index}`;
          addToLog(`Updated metadata for "${imageFileName}"`);
          
          return {
            ...img,
            metadata: {
              ...img.metadata,
              title: metadata.title || img.metadata.title,
              description: metadata.description || img.metadata.description,
              date: metadata.date || img.metadata.date,
              year: metadata.year || img.metadata.year,
              location: metadata.address || metadata.location || img.metadata.location,
              gps: metadata.gps || img.metadata.gps,
              is_true_event: metadata.is_historical ?? img.metadata.is_true_event,
              is_ai_generated: metadata.is_ai_generated ?? img.metadata.is_ai_generated,
              is_mature_content: metadata.is_mature_content ?? false,
              manual_override: metadata.manual_override ?? img.metadata.manual_override ?? false,
              accuracy_description: metadata.accuracy_description,
              accuracy_date: metadata.accuracy_date,
              accuracy_location: metadata.accuracy_location,
              accuracy_historical: metadata.accuracy_historical,
              accuracy_realness: metadata.accuracy_realness,
              accuracy_maturity: metadata.accuracy_maturity
            }
          };
        }
        return img;
      })
    );
    
    toast({
      title: "Image metadata updated",
      description: "The image metadata has been verified and updated",
    });
  }, [toast, addToLog]);

  const saveToDatabase = useCallback(async () => {
    const selectedImages = processedImages.filter(img => img.selected);
    
    if (selectedImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to save",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      addToLog(`Starting database save for ${selectedImages.length} images`);
      
      const readyImages = selectedImages.filter(img => img.ready_for_game);
      
      const savedImages = await Promise.all(
        selectedImages.map(async (img) => {
          addToLog(`Saving image "${img.originalFileName}" to database...`);
          
          const { data, error } = await supabase
            .from('images')
            .insert({
              title: img.metadata.title,
              description: img.metadata.description,
              date: img.metadata.date,
              year: img.metadata.year,
              location: img.metadata.location,
              gps: img.metadata.gps,
              is_true_event: img.metadata.is_true_event,
              is_ai_generated: img.metadata.is_ai_generated,
              ready_for_game: img.ready_for_game,
              image_url: img.imageUrl,
              description_image_url: img.descriptionImageUrl,
              is_mature_content: img.metadata.is_mature_content,
              accuracy_description: img.metadata.accuracy_description,
              accuracy_date: img.metadata.accuracy_date,
              accuracy_location: img.metadata.accuracy_location,
              accuracy_historical: img.metadata.accuracy_historical,
              accuracy_realness: img.metadata.accuracy_realness,
              accuracy_maturity: img.metadata.accuracy_maturity,
              manual_override: img.metadata.manual_override
            } as any)
            .select();
            
          if (error) {
            addToLog(`ERROR: Failed to save "${img.originalFileName}" - ${error.message}`);
            throw error;
          }
          
          addToLog(`Successfully saved "${img.originalFileName}" to AI Pilot DB`);
          
          if (img.ready_for_game && selectedProjectId) {
            try {
              const project = availableProjects.find(p => p.id === selectedProjectId);
              
              if (project && project.isConnected) {
                addToLog(`Saving "${img.originalFileName}" to project '${project.name}'...`);
                
                const response = await supabase.functions.invoke('image-metadata-verification', {
                  body: { 
                    imageUrl: img.imageUrl,
                    imageId: img.originalFileName,
                    metadata: img.metadata,
                    saveToGameDb: true,
                    projectId: project.supabaseId
                  }
                });
                
                if (response.error) {
                  addToLog(`WARNING: Could not save to project '${project.name}' - ${response.error.message}`);
                } else {
                  addToLog(`Successfully saved "${img.originalFileName}" to ${project.name}`);
                }
              } else {
                addToLog(`WARNING: Project ${selectedProjectId} not found or not connected`);
              }
            } catch (projectSaveError) {
              addToLog(`WARNING: Project save failed - ${projectSaveError.message}`);
              console.error("Project save error:", projectSaveError);
            }
          }
          
          return data;
        })
      );
      
      let totalAccuracy = 0;
      let accuracyCount = 0;
      
      selectedImages.forEach(img => {
        const accuracies = [
          img.metadata.accuracy_description,
          img.metadata.accuracy_date,
          img.metadata.accuracy_location,
          img.metadata.accuracy_historical,
          img.metadata.accuracy_realness,
          img.metadata.accuracy_maturity
        ].filter(score => score !== undefined && score !== null) as number[];
        
        if (accuracies.length > 0) {
          totalAccuracy += accuracies.reduce((sum, score) => sum + score, 0) / accuracies.length;
          accuracyCount++;
        }
      });
      
      const averageAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0;
      
      let summaryMessage = `${selectedImages.length} images processed.`;
      
      if (accuracyCount > 0) {
        summaryMessage += ` Metadata saved with average accuracy ${averageAccuracy.toFixed(2)}.`;
      }
      
      if (selectedProjectId && readyImages.length > 0) {
        const project = availableProjects.find(p => p.id === selectedProjectId);
        summaryMessage += ` ${readyImages.length} saved to ${project?.name || selectedProjectId}.`;
      }
      
      toast({
        title: "Images saved successfully",
        description: summaryMessage,
      });
      
      try {
        localStorage.removeItem('processedImages');
        localStorage.removeItem('processLog');
      } catch (e) {
        console.warn("Could not clear localStorage", e);
      }
      
      setActiveTab('gallery');
      
      setProcessedImages([]);
      setProcessLog([]);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save images to the database",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [processedImages, toast, addToLog, selectedProjectId, availableProjects]);

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This will remove all images and logs.")) {
      setProcessedImages([]);
      setProcessLog([]);
      
      try {
        localStorage.removeItem('processedImages');
        localStorage.removeItem('processLog');
        localStorage.removeItem('verifiedImagesMetadata');
        localStorage.removeItem('verifiedImageIds');
      } catch (e) {
        console.warn("Could not clear localStorage", e);
      }
      
      toast({
        title: "Data cleared",
        description: "All images and logs have been cleared",
      });
    }
  };

  const handleGeneratedImage = useCallback((response: ImageGenerationResponse) => {
    if (!response || !response.imageUrl) {
      toast({
        title: "Invalid image data",
        description: "The generated image data is incomplete",
        variant: "destructive"
      });
      return;
    }
    
    addToLog(`Adding AI-generated image to processed images: ${response.metadata.title}`);
    
    const newProcessedImage: ProcessedImage = {
      originalFileName: `ai_generated_${Date.now()}.png`,
      descFileName: `desc_ai_generated_${Date.now()}.png`,
      metadata: {
        title: response.metadata.title,
        description: response.metadata.description,
        date: response.metadata.date,
        year: response.metadata.year,
        location: response.metadata.address,
        gps: response.metadata.gps ? {
          lat: response.metadata.gps.lat,
          lon: response.metadata.gps.lng
        } : null,
        is_true_event: response.metadata.true_event,
        is_ai_generated: response.metadata.ai_generated,
        is_mature_content: response.metadata.mature,
        manual_override: true, // Mark as manually verified
        source: response.metadata.source
      },
      imageUrl: response.imageUrl,
      descriptionImageUrl: response.imageUrl, // Use same image for description
      ready_for_game: response.metadata.ready,
      selected: true
    };
    
    setProcessedImages(prev => [...prev, newProcessedImage]);
    setActiveTab('upload'); // Switch to upload tab to show review grid
    
    toast({
      title: "Image added to collection",
      description: "The AI-generated image has been added to your collection for review",
    });
  }, [toast, addToLog]);

  const handlePromptsGenerated = useCallback((prompts: WriterPromptEntry[]) => {
    console.log("Prompts generated:", prompts);
    // This is just for tracking purposes, the actual handling happens in WriterPromptGenerator
  }, []);

  return (
    <>
      <Helmet>
        <title>Image Upload | EventGuess</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Image Collector</h1>
            <p className="text-muted-foreground">
              Upload, manage and verify images for AI Pilot projects
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="generate">
          <TabsList>
            <TabsTrigger value="generate">
              <Wand2 className="h-4 w-4 mr-2" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="writer">
              <Feather className="h-4 w-4 mr-2" />
              Writer
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Image className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Image Generator</CardTitle>
                <CardDescription>
                  Generate AI images of historical events using DALL-E
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageGeneratorUI onImageGenerated={handleGeneratedImage} suppressHeader={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="writer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Writer Prompt Generator</CardTitle>
                <CardDescription>
                  Create structured prompts with metadata for historical events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WriterPromptGenerator 
                  onPromptsGenerated={handlePromptsGenerated} 
                  onImageGenerated={handleGeneratedImage}
                  addToLog={addToLog}
                />
              </CardContent>
            </Card>
            
            {processLog.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Log</CardTitle>
                  <CardDescription>
                    Activity log for prompt and image generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md max-h-40 overflow-y-auto text-sm font-mono">
                    {processLog.map((log, index) => (
                      <div key={index} className="py-0.5">{log}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Image Files</CardTitle>
                <CardDescription>
                  Drag & drop images directly or upload ZIP files with images and their descriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader 
                  onUpload={handleUpload} 
                  isUploading={isUploading} 
                  isProcessing={isProcessing}
                  onMetadataFileSelect={handleMetadataFileSelect}
                />
              </CardContent>
            </Card>
            
            {processLog.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Log</CardTitle>
                  <CardDescription>
                    Activity log for image processing operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md max-h-40 overflow-y-auto text-sm font-mono">
                    {processLog.map((log, index) => (
                      <div key={index} className="py-0.5">{log}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {processedImages.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Review Images ({processedImages.length})</CardTitle>
                    <CardDescription>
                      Review and select images before saving to the database
                    </CardDescription>
                  </div>
                  <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all" 
                        checked={processedImages.every(img => img.selected)}
                        onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Select All
                      </label>
                    </div>
                    
                    <select 
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">Save to Pilot DB Only</option>
                      {availableProjects.map(project => (
                        <option key={project.id} value={project.id} disabled={!project.isConnected}>
                          {project.name} {!project.isConnected && "(Disconnected)"}
                        </option>
                      ))}
                    </select>
                    
                    <Button 
                      onClick={saveToDatabase} 
                      disabled={isSaving || !processedImages.some(img => img.selected)}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? "Saving..." : "Save to Database"}</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={clearAllData}
                      className="ml-auto md:ml-0"
                    >
                      Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ImageReviewGrid 
                    images={processedImages}
                    onToggleSelection={toggleImageSelection}
                    onToggleReadyForGame={toggleReadyForGame}
                    onImageMetadataUpdate={handleImageMetadataUpdate}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="gallery">
            <Card>
              <CardContent className="pt-6">
                <SavedImagesGallery />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ImageUpload;
