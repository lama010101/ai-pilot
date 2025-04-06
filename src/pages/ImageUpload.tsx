
import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image, Check, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageUploader from '@/components/image-upload/ImageUploader';
import ImageReviewGrid from '@/components/image-upload/ImageReviewGrid';

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
  const { toast } = useToast();

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
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('eventZip', eventZipFile);
      formData.append('descriptionZip', descZipFile);
      
      // Call the Supabase edge function
      const response = await supabase.functions.invoke('process-images', {
        body: formData,
        headers: {
          // No Content-Type header needed as it will be set automatically for FormData
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Error processing images');
      }
      
      // Add selection state to each image
      const images = response.data.processedImages.map((img: ProcessedImage) => ({
        ...img,
        ready_for_game: false,
        selected: true
      }));
      
      setProcessedImages(images);
      
      toast({
        title: "Processing complete",
        description: `Successfully processed ${images.length} images`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error processing your images",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [toast]);

  const toggleSelectAll = useCallback((selected: boolean) => {
    setProcessedImages(prev => 
      prev.map(img => ({ ...img, selected }))
    );
  }, []);

  const toggleImageSelection = useCallback((index: number, selected: boolean) => {
    setProcessedImages(prev => 
      prev.map((img, i) => i === index ? { ...img, selected } : img)
    );
  }, []);

  const toggleReadyForGame = useCallback((index: number, ready: boolean) => {
    setProcessedImages(prev => 
      prev.map((img, i) => i === index ? { ...img, ready_for_game: ready } : img)
    );
  }, []);

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
      
      // Save each image to the database
      const savedImages = await Promise.all(
        selectedImages.map(async (img) => {
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
              description_image_url: img.descriptionImageUrl
            })
            .select()
            .single();
            
          if (error) throw error;
          return data;
        })
      );
      
      toast({
        title: "Images saved successfully",
        description: `Saved ${savedImages.length} images to the database`,
      });
      
      // Clear processed images after successful save
      setProcessedImages([]);
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
  }, [processedImages, toast]);

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
            />
          </CardContent>
        </Card>
        
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
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default ImageUpload;
