import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, ImagePlus, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import ImageUploader from "@/components/image-upload/ImageUploader";
import ImageReviewGrid from "@/components/image-upload/ImageReviewGrid";
import ImageProcessingButton from "@/components/image-upload/ImageProcessingButton";
import ImageGeneratorUI from "@/components/image-upload/ImageGeneratorUI";
import SavedImagesGallery from "@/components/image-upload/SavedImagesGallery";
import BackfillImagesButton from "@/components/image-upload/BackfillImagesButton";
import { ProcessedImage, ImageDB } from '@/types/supabase';

interface Metadata {
  title?: string;
  description?: string;
  date?: string;
  year?: number;
  location?: string;
  country?: string;
  gps?: {
    lat: number;
    lng: number;
  };
  is_true_event?: boolean;
  is_ai_generated?: boolean;
  is_mature_content?: boolean;
  source?: string;
  accuracy_description?: number;
  accuracy_date?: number;
  accuracy_location?: number;
  accuracy_historical?: number;
  accuracy_realness?: number;
  accuracy_maturity?: number;
  manual_override?: boolean;
  ready?: boolean;
}

const ImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [allImages, setAllImages] = useState<ImageDB[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<any>(null);
  const { toast } = useToast();

  // Load images on mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Function to fetch images from Supabase
  const fetchImages = async () => {
    setIsLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setAllImages(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching images",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Function to handle successful image upload and processing
  const handleUpload = useCallback(async (files: FileList, metadataFile: File | null = null) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prevProgress => {
        const newProgress = prevProgress + 10;
        return Math.min(newProgress, 95);
      });
    }, 300);

    try {
      const uploadPromises = [];
      const uploadedFiles = [];

      // Helper function to upload a single file
      const uploadFile = async (file: File): Promise<{ imageUrl: string; descriptionImageUrl: string }> => {
        const imageName = `${Date.now()}-${file.name}`;
        const imagePath = `images/${imageName}`;

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(imagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(`File upload failed: ${error.message}`);
        }

        const imageUrl = `${supabase.storageUrl}/avatars/${imagePath}`;
        return { imageUrl, descriptionImageUrl: imageUrl }; // Assuming description image is the same
      };

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        uploadPromises.push(uploadFile(file));
        uploadedFiles.push(file);
      }

      const uploadResults = await Promise.all(uploadPromises);

      // Process metadata if a file is provided
      let metadataFromFile: { [key: string]: Metadata } = {};
      if (metadataFile) {
        metadataFromFile = await processMetadataFile(metadataFile);
      }

      // Create ProcessedImage objects
      const newImages = uploadedFiles.map((file, index) => {
        const { imageUrl, descriptionImageUrl } = uploadResults[index];
        const metadata = metadataFromFile[file.name] || {};

        return {
          originalFileName: file.name,
          metadata,
          imageUrl,
          descriptionImageUrl: imageUrl,
          mobileUrl: imageUrl,
          tabletUrl: imageUrl,
          desktopUrl: imageUrl,
          ready_for_game: false,
          selected: true
        };
      });

      setProcessedImages(prevImages => [...prevImages, ...newImages]);
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} images`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      fetchImages();
    }
  }, [toast]);

  // Function to process the metadata file (Excel/CSV)
  const processMetadataFile = async (file: File): Promise<{ [key: string]: Metadata }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonMetadata: any[] = XLSX.utils.sheet_to_json(worksheet);

          // Transform the JSON metadata into the desired format
          const metadataMap: { [key: string]: Metadata } = {};
          jsonMetadata.forEach(item => {
            const fileName = item['file_name'] || item['filename'] || item['name']; // Adjust key as needed
            if (fileName) {
              metadataMap[fileName] = {
                title: item['title'],
                description: item['description'],
                date: item['date'],
                year: item['year'],
                location: item['location'],
                country: item['country'],
                gps: {
                  lat: item['gps_lat'],
                  lng: item['gps_lng']
                },
                is_true_event: item['is_true_event'],
                is_ai_generated: item['is_ai_generated'],
                is_mature_content: item['is_mature_content'],
                source: item['source'],
                accuracy_description: item['accuracy_description'],
                accuracy_date: item['accuracy_date'],
                accuracy_location: item['accuracy_location'],
                accuracy_historical: item['accuracy_historical'],
                accuracy_realness: item['accuracy_realness'],
                accuracy_maturity: item['accuracy_maturity'],
                manual_override: item['manual_override'],
                ready: item['ready']
              };
            }
          });

          resolve(metadataMap);
        } catch (error: any) {
          reject(new Error(`Metadata processing failed: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read the metadata file."));
      };

      reader.readAsBinaryString(file);
    });
  };

  // Function to toggle the selection state of an image
  const handleToggleSelection = (index: number, selected: boolean) => {
    setProcessedImages(prevImages => {
      const newImages = [...prevImages];
      newImages[index] = { ...newImages[index], selected };
      return newImages;
    });
  };

  // Function to toggle the ready_for_game state of an image
  const handleToggleReadyForGame = (index: number, ready_for_game: boolean) => {
    setProcessedImages(prevImages => {
      const newImages = [...prevImages];
      newImages[index] = { ...newImages[index], ready_for_game };
      return newImages;
    });
  };

  const handleImageMetadataUpdate = (index: number, metadata: any) => {
    setProcessedImages(prevImages => {
      const newImages = [...prevImages];
      newImages[index] = { ...newImages[index], metadata };
      return newImages;
    });
  };

  // Function to handle metadata file selection
  const handleMetadataFileSelect = (file: File | null) => {
    setMetadataFile(file);
  };

  // Function to handle successful image processing
  const handleProcessingComplete = (metadata: any) => {
    setIsProcessing(false);
    setIsVerified(true);
    toast({
      title: "Image processing complete",
      description: "Successfully processed image metadata",
    });
  };

  // If there's a handleGeneratedImage function, update it too
  const handleGeneratedImage = useCallback((response: any) => {
    const newImage: ProcessedImage = {
      originalFileName: `generated-${Date.now()}.png`,
      metadata: {
        title: response.metadata.title,
        description: response.metadata.description,
        date: response.metadata.date,
        year: response.metadata.year,
        location: response.metadata.location,
        country: response.metadata.country,
        gps: response.metadata.gps,
        is_true_event: response.metadata.is_true_event,
        is_ai_generated: true,
        is_mature_content: response.metadata.is_mature_content,
        source: 'dalle',
        accuracy_description: response.metadata.accuracy_description,
        accuracy_date: response.metadata.accuracy_date,
        accuracy_location: response.metadata.accuracy_location,
        accuracy_historical: response.metadata.accuracy_historical,
        accuracy_realness: response.metadata.accuracy_realness,
        accuracy_maturity: response.metadata.accuracy_maturity,
        manual_override: true,
        ready: true
      },
      imageUrl: response.imageUrl,
      descriptionImageUrl: response.imageUrl,
      mobileUrl: response.imageUrl,
      tabletUrl: response.imageUrl,
      desktopUrl: response.imageUrl,
      ready_for_game: response.metadata.ready,
      selected: true
    };

    setProcessedImages(prevImages => [newImage, ...prevImages]);
    setAllImages(prevImages => [{
      id: `generated-${Date.now()}`,
      title: response.metadata.title,
      description: response.metadata.description,
      date: response.metadata.date,
      year: response.metadata.year,
      location: response.metadata.location,
      gps: response.metadata.gps,
      is_true_event: response.metadata.is_true_event,
      is_ai_generated: true,
      is_mature_content: response.metadata.is_mature_content,
      image_url: response.imageUrl,
      description_image_url: response.imageUrl,
      image_mobile_url: response.imageUrl,
      image_tablet_url: response.imageUrl,
      image_desktop_url: response.imageUrl,
      ready_for_game: response.metadata.ready,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      accuracy_description: response.metadata.accuracy_description,
      accuracy_date: response.metadata.accuracy_date,
      accuracy_location: response.metadata.accuracy_location,
      accuracy_historical: response.metadata.accuracy_historical,
      accuracy_realness: response.metadata.accuracy_realness,
      accuracy_maturity: response.metadata.accuracy_maturity,
      manual_override: true,
      source: 'dalle',
      country: response.metadata.country,
      hints: null,
      short_description: null,
      detailed_description: null
    }, ...prevImages]);

    toast({
      title: "Image generated",
      description: "Successfully generated image from prompt",
    });
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Image Upload | AI Pilot</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Image Upload</h1>
          <p className="text-muted-foreground">
            Upload images, process metadata, and generate new images
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Images</CardTitle>
            <CardDescription>
              Upload image files and an optional metadata file to process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader
              onUpload={handleUpload}
              onMetadataFileSelect={handleMetadataFileSelect}
              isUploading={isUploading}
              isProcessing={isProcessing}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image Review</CardTitle>
            <CardDescription>
              Review uploaded images, update metadata, and set ready status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedImages.length > 0 ? (
              <ImageReviewGrid
                images={processedImages}
                onToggleSelection={handleToggleSelection}
                onToggleReadyForGame={handleToggleReadyForGame}
                onImageMetadataUpdate={handleImageMetadataUpdate}
              />
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No images uploaded yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Image Generation</CardTitle>
            <CardDescription>
              Generate new images using AI based on a prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGeneratorUI
              onImageGenerated={handleGeneratedImage}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Images</CardTitle>
            <CardDescription>
              View and manage previously uploaded and generated images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavedImagesGallery
              images={allImages}
              isLoading={isLoadingImages}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backfill Images</CardTitle>
            <CardDescription>
              Process existing images to generate responsive versions and extract metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BackfillImagesButton
              onComplete={(result) => {
                setBackfillResult(result);
                setIsBackfilling(false);
                fetchImages();
              }}
            />
            {backfillResult && (
              <div className="mt-4">
                <h3 className="text-lg font-medium">Backfill Result</h3>
                <p>Processed: {backfillResult.processed}</p>
                <p>Metadata Updated: {backfillResult.metadata_updated}</p>
                <p>Images Updated: {backfillResult.images_updated}</p>
                <p>Failures: {backfillResult.failures}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ImageUpload;
