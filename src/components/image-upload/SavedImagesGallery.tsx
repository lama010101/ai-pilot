import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageDB } from '@/types/supabase';

interface SavedImagesGalleryProps {
  images: ImageDB[];
  onImageClick: (image: ImageDB) => void;
}

const SavedImagesGallery: React.FC<SavedImagesGalleryProps> = ({ images, onImageClick }) => {
  const [selectedImage, setSelectedImage] = useState<ImageDB | null>(null);

  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0]);
    }
  }, [images]);

  const handleImageClick = (image: ImageDB) => {
    setSelectedImage(image);
    onImageClick(image);
  };

  const formatImageForViewer = (image: ImageDB) => {
    return {
      url: image.image_url || '',
      mobileUrl: image.image_mobile_url || image.image_url || '',
      tabletUrl: image.image_tablet_url || image.image_url || '',
      desktopUrl: image.image_desktop_url || image.image_url || '',
      title: image.title || '',
      description: image.description || '',
      date: image.date || null,
      year: image.year || null,
      location: image.location || null,
      country: image.country || null,
      is_true_event: image.is_true_event || false,
      is_ai_generated: image.is_ai_generated || false,
      is_mature_content: image.is_mature_content || false,
      source: image.source || '',
      gps: image.gps,
      accuracy_description: image.accuracy_description,
      accuracy_date: image.accuracy_date,
      accuracy_location: image.accuracy_location,
      accuracy_historical: image.accuracy_historical,
      accuracy_realness: image.accuracy_realness,
      accuracy_maturity: image.accuracy_maturity
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Saved Images</CardTitle>
        <CardDescription>
          Click an image to view details
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative aspect-square overflow-hidden rounded-md cursor-pointer hover:opacity-75 transition-opacity ${selectedImage?.id === image.id ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                onClick={() => handleImageClick(image)}
              >
                {image.image_url ? (
                  <img
                    src={image.image_url}
                    alt={image.title || 'Image'}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-muted">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                {image.is_ai_generated && (
                  <Badge className="absolute top-2 left-2">AI</Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SavedImagesGallery;
