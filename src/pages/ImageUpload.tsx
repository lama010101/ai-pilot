
import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image, Check, X, Save, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageUploader from '@/components/image-upload/ImageUploader';
import ImageReviewGrid from '@/components/image-upload/ImageReviewGrid';
import * as XLSX from 'xlsx';

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
  };
  imageUrl: string;
  descriptionImageUrl: string;
  ready_for_game?: boolean;
  selected?: boolean;
}

const ImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [processLog, setProcessLog] = useState<string[]>([]);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Load saved state from localStorage on initial load
  useEffect(() => {
    try {
      // Attempt to load processed images
      const savedImages = localStorage.getItem('processedImages');
      if (savedImages) {
        const parsedImages = JSON.parse(savedImages);
        setProcessedImages(parsedImages);
        
        addToLog("Restored previously processed images from localStorage");
      }
      
      // Attempt to load process log
      const savedLog = localStorage.getItem('processLog');
      if (savedLog) {
        const parsedLog = JSON.parse(savedLog);
        setProcessLog(parsedLog);
      }
    } catch (e) {
      console.warn("Could not load state from localStorage", e);
    }
  }, []);
  
  // Save state to localStorage whenever it changes
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
  
  // Helper function to add to process log
  const addToLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessLog(prevLog => [...prevLog, `[${timestamp}] ${message}`]);
  }, []);

  // Process metadata Excel file if provided
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
  
  // Find metadata for an image by filename
  const findMetadataForImage = useCallback((filename: string, metadataArray: any[]) => {
    const baseName = filename.split('.')[0]; // Remove extension
    return metadataArray.find(item => {
      // Try to match with filename or ID column if it exists
      return (item.filename && item.filename.includes(baseName)) || 
             (item.id && item.id.includes(baseName)) ||
             (item.file && item.file.includes(baseName));
    });
  }, []);

  const handleUpload = useCallback(async (eventZipFile: File, descZipFile: File) => {
    if (!eventZipFile || !descZipFile) {
      toast({
        title: "Missing files",
        description: "Please select both event and description ZIP files",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(true);
      addToLog(`Starting upload process for ${eventZipFile.name} and ${descZipFile.name}`);
      
      // Process metadata file if provided
      let metadataEntries: any[] = [];
      if (metadataFile) {
        metadataEntries = await processMetadataFile(metadataFile);
      }
      
      const formData = new FormData();
      formData.append('eventZip', eventZipFile);
      formData.append('descriptionZip', descZipFile);
      
      addToLog("Sending files to processing function...");
      
      const response = await supabase.functions.invoke('process-images', {
        body: formData,
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Error processing images');
      }
      
      addToLog(`Successfully processed ${response.data.processedImages.length} images`);
      
      const images = response.data.processedImages.map((img: ProcessedImage) => {
        // Check if we have metadata for this image in the Excel file
        let enhancedMetadata = { ...img.metadata };
        
        if (metadataEntries.length > 0) {
          const matchedMetadata = findMetadataForImage(img.originalFileName, metadataEntries);
          if (matchedMetadata) {
            addToLog(`Found metadata match for ${img.originalFileName} in Excel file`);
            
            // Only use Excel data for fields that are not already populated
            if (!enhancedMetadata.title && matchedMetadata.title) {
              enhancedMetadata.title = matchedMetadata.title;
            }
            if (!enhancedMetadata.description && matchedMetadata.description) {
              enhancedMetadata.description = matchedMetadata.description;
            }
            if (!enhancedMetadata.date && matchedMetadata.date) {
              enhancedMetadata.date = matchedMetadata.date;
            }
            if (!enhancedMetadata.year && matchedMetadata.year) {
              enhancedMetadata.year = parseInt(matchedMetadata.year);
            }
            if (!enhancedMetadata.location && matchedMetadata.location) {
              enhancedMetadata.location = matchedMetadata.location;
            }
          }
        }
        
        return {
          ...img,
          metadata: enhancedMetadata,
          ready_for_game: false,
          selected: true
        };
      });
      
      setProcessedImages(images);
      
      toast({
        title: "Processing complete",
        description: `Successfully processed ${images.length} images`,
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
  }, [toast, addToLog, metadataFile, processMetadataFile, findMetadataForImage]);

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
          
          // If ready for game, also save to Guess-History DB
          if (img.ready_for_game) {
            try {
              // Instead of direct DB connection, we use the edge function
              const response = await supabase.functions.invoke('image-metadata-verification', {
                body: { 
                  imageUrl: img.imageUrl,
                  imageId: img.originalFileName,
                  metadata: img.metadata,
                  saveToGameDb: true
                }
              });
              
              if (response.error) {
                addToLog(`WARNING: Could not save to game DB - ${response.error.message}`);
              } else {
                addToLog(`Successfully saved "${img.originalFileName}" to Game DB`);
              }
            } catch (gameDbError) {
              addToLog(`WARNING: Game DB save failed - ${gameDbError.message}`);
              console.error("Game DB save error:", gameDbError);
            }
          }
          
          return data;
        })
      );
      
      toast({
        title: "Images saved successfully",
        description: `Saved ${savedImages.length} images to the database`,
      });
      
      // Clear localStorage after successful save
      try {
        localStorage.removeItem('processedImages');
        localStorage.removeItem('processLog');
      } catch (e) {
        console.warn("Could not clear localStorage", e);
      }
      
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
  }, [processedImages, toast, addToLog]);

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This will remove all images and logs.")) {
      setProcessedImages([]);
      setProcessLog([]);
      
      // Clear localStorage
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

  return (
    <>
      <Helmet>
        <title>Image Upload | EventGuess</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Image Upload & Processing</h1>
            <p className="text-muted-foreground">
              Upload ZIP files containing event images and their descriptions
            </p>
          </div>
          
          {processedImages.length > 0 && (
            <Button variant="outline" onClick={clearAllData}>
              Clear All Data
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload Image Files</CardTitle>
            <CardDescription>
              Select two ZIP files: one with event images and one with corresponding description images
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
              <div className="flex items-center space-x-4">
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
                <Button 
                  onClick={saveToDatabase} 
                  disabled={isSaving || !processedImages.some(img => img.selected)}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Selected to Database</span>
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
      </div>
    </>
  );
};

export default ImageUpload;
