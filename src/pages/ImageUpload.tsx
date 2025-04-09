
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProcessedImage, ImageDB } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';
import ImageUploader from "@/components/image-upload/ImageUploader";
import ImageReviewGrid from "@/components/image-upload/ImageReviewGrid";
import SavedImagesGallery from "@/components/image-upload/SavedImagesGallery";
import WriterPromptGenerator from "@/components/image-upload/WriterPromptGenerator";
import ImageGeneratorUI from "@/components/image-upload/ImageGeneratorUI";
import { useImageProviderStore } from '@/stores/imageProviderStore';
import { useImageUiStore } from '@/stores/imageUiStore';
import * as XLSX from 'xlsx';

const ImageUpload = () => {
  const { 
    activeTab, 
    setActiveTab, 
    gallerySubTab, 
    setGallerySubTab, 
    processedImages, 
    setProcessedImages, 
    addProcessedImage, 
    updateProcessedImage 
  } = useImageUiStore();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [reviewImages, setReviewImages] = useState<ImageDB[]>([]);
  const [storedImages, setStoredImages] = useState<ImageDB[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  // Fetch images on component mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Separate images into review and stored categories
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

      const processedData = data?.map(img => {
        // Cast the database result to ensure it has the correct types
        const typedImg = img as unknown as ImageDB;
        return {
          ...typedImg,
          image_mobile_url: typedImg.image_mobile_url || typedImg.image_url,
          image_tablet_url: typedImg.image_tablet_url || typedImg.image_url,
          image_desktop_url: typedImg.image_desktop_url || typedImg.image_url
        } as ImageDB;
      }) || [];
      
      // Split images into review (not ready) and stored (ready)
      const review = processedData.filter(img => !img.ready_for_game);
      const stored = processedData.filter(img => img.ready_for_game);
      
      setReviewImages(review);
      setStoredImages(stored);
    } catch (error: any) {
      toast.error("Error fetching images: " + error.message);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const addToLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const handleUpload = useCallback(async (files: FileList, metadataFile: File | null = null) => {
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prevProgress => {
        const newProgress = prevProgress + 10;
        return Math.min(newProgress, 95);
      });
    }, 300);

    try {
      const uploadPromises = [];
      const uploadedFiles = [];

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

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(imagePath);

        const imageUrl = urlData.publicUrl || '';
        return { imageUrl, descriptionImageUrl: imageUrl };
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        uploadPromises.push(uploadFile(file));
        uploadedFiles.push(file);
      }

      const uploadResults = await Promise.all(uploadPromises);

      let metadataFromFile: { [key: string]: any } = {};
      if (metadataFile) {
        metadataFromFile = await processMetadataFile(metadataFile);
      }

      const newImages: ProcessedImage[] = uploadedFiles.map((file, index) => {
        const { imageUrl, descriptionImageUrl } = uploadResults[index];
        const metadata = metadataFromFile[file.name] || {};

        // Create a proper ProcessedImage object with an id
        return {
          id: uuidv4(), // Generate a unique ID for each image
          originalFileName: file.name,
          metadata,
          imageUrl,
          descriptionImageUrl,
          mobileUrl: imageUrl,
          tabletUrl: imageUrl,
          desktopUrl: imageUrl,
          ready_for_game: false,
          selected: true
        };
      });

      setProcessedImages([...processedImages, ...newImages]);
      toast.success("Successfully uploaded " + files.length + " images");
      
      // Switch to the upload tab to show the uploaded images
      setActiveTab('upload');
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      fetchImages();
    }
  }, [processedImages, setProcessedImages, setActiveTab]);

  const processMetadataFile = async (file: File): Promise<{ [key: string]: any }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonMetadata: any[] = XLSX.utils.sheet_to_json(worksheet);

          const metadataMap: { [key: string]: any } = {};
          jsonMetadata.forEach(item => {
            const fileName = item['file_name'] || item['filename'] || item['name'];
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

  const handleToggleSelection = (index: number, selected: boolean) => {
    updateProcessedImage(index, { selected });
  };

  const handleToggleReadyForGame = async (index: number, ready_for_game: boolean) => {
    // First update local state
    updateProcessedImage(index, { ready_for_game });
    
    // If the image has an actual ID (is already in Supabase), update it
    const image = processedImages[index];
    if (image.id && !image.id.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('images')
          .update({ ready_for_game })
          .eq('id', image.id);
          
        if (error) throw error;
        
        toast.success(`Image marked as ${ready_for_game ? 'ready' : 'not ready'} for use`);
        // Refresh the gallery to show the updated state
        fetchImages();
      } catch (error: any) {
        toast.error(`Failed to update image status: ${error.message}`);
      }
    }
  };

  const handleImageMetadataUpdate = (index: number, metadata: any) => {
    updateProcessedImage(index, { metadata });
  };

  const handleMetadataFileSelect = (file: File | null) => {
    setMetadataFile(file);
  };

  const handleGeneratedImage = useCallback((response: any) => {
    // Add generated image to processed list
    if (response && response.imageUrl) {
      const newImage: ProcessedImage = {
        id: uuidv4(),
        originalFileName: `generated-${Date.now()}.png`,
        metadata: response.metadata || {},
        imageUrl: response.imageUrl,
        descriptionImageUrl: response.imageUrl,
        mobileUrl: response.imageUrl,
        tabletUrl: response.imageUrl,
        desktopUrl: response.imageUrl,
        ready_for_game: false,
        selected: true
      };
      
      addProcessedImage(newImage);
    }
    
    fetchImages(); // Refresh gallery
    toast.success("Successfully generated image from prompt");
    
    // Switch to gallery tab to show the generated image
    setActiveTab('gallery');
    setGallerySubTab('review');
  }, [addProcessedImage, setActiveTab, setGallerySubTab]);

  return (
    <>
      <Helmet>
        <title>Image Collector – Upload, manage and verify images for AI Pilot projects</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Image Collector</h1>
          <p className="text-muted-foreground">
            Upload, manage and verify images for AI Pilot projects
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="writer">Writer</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="writer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Writer Image Generation</CardTitle>
                <CardDescription>
                  Use the Writer agent to generate structured image prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WriterPromptGenerator
                  onPromptsGenerated={(prompts) => {
                    console.log("Generated prompts:", prompts);
                    addToLog(`✅ Generated ${prompts.length} prompts successfully`);
                  }}
                  onImageGenerated={handleGeneratedImage}
                  addToLog={addToLog}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Image Generation</CardTitle>
                <CardDescription>
                  Generate images using AI based on a prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageGeneratorUI
                  onImageGenerated={handleGeneratedImage}
                  addToLog={addToLog}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
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

            {processedImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Image Review</CardTitle>
                  <CardDescription>
                    Review uploaded images, update metadata, and set ready status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageReviewGrid
                    images={processedImages}
                    onToggleSelection={handleToggleSelection}
                    onToggleReadyForGame={handleToggleReadyForGame}
                    onImageMetadataUpdate={handleImageMetadataUpdate}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>
                  Browse and manage all saved images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={gallerySubTab} onValueChange={setGallerySubTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="review">Review</TabsTrigger>
                    <TabsTrigger value="stored">Stored</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="review" className="space-y-4">
                    <SavedImagesGallery
                      images={reviewImages}
                      isLoading={isLoadingImages}
                      onImageClick={(image) => {
                        console.log("Review image clicked:", image);
                      }}
                      onRefresh={fetchImages}
                    />
                  </TabsContent>
                  
                  <TabsContent value="stored" className="space-y-4">
                    <SavedImagesGallery
                      images={storedImages}
                      isLoading={isLoadingImages}
                      onImageClick={(image) => {
                        console.log("Stored image clicked:", image);
                      }}
                      onRefresh={fetchImages}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ImageUpload;
