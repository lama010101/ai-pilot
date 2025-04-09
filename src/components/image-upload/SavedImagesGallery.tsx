import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCcw, Eye, Trash2, CheckSquare } from "lucide-react";
import { ImageDB } from '@/types/supabase';
import { ScrollArea } from "@/components/ui/scroll-area";
import FullscreenImageViewer from './FullscreenImageViewer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SavedImagesGalleryProps {
  images: ImageDB[];
  isLoading: boolean;
  onImageClick?: (image: ImageDB) => void;
  onRefresh?: () => void;
}

const SavedImagesGallery: React.FC<SavedImagesGalleryProps> = ({ 
  images, 
  isLoading,
  onImageClick,
  onRefresh
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageDB | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleViewImage = (image: ImageDB) => {
    setSelectedImage(image);
    setViewerOpen(true);
    if (onImageClick) {
      onImageClick(image);
    }
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

  const deleteImage = async (imageId: string) => {
    if (!imageId) return;

    setIsDeleting(prev => ({ ...prev, [imageId]: true }));
    
    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);
        
      if (error) throw error;
      
      toast.success('Image deleted successfully');
      setSelectedImages(prev => prev.filter(id => id !== imageId));
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(`Failed to delete image: ${error.message}`);
    } finally {
      setIsDeleting(prev => ({ ...prev, [imageId]: false }));
    }
  };

  const getProviderLabel = (source?: string) => {
    if (!source) return 'Unknown';
    
    switch(source.toLowerCase()) {
      case 'dalle':
        return 'DALL·E';
      case 'midjourney':
        return 'Midjourney';
      case 'vertex':
        return 'Vertex AI';
      default:
        return source.charAt(0).toUpperCase() + source.slice(1);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId);
      } else {
        return [...prev, imageId];
      }
    });
  };

  const toggleReadyStatus = async (imageId: string, currentStatus: boolean) => {
    setIsUpdating(prev => ({ ...prev, [imageId]: true }));
    
    try {
      const { error } = await supabase
        .from('images')
        .update({ 
          ready_for_game: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);
        
      if (error) throw error;
      
      toast.success(`Image ${!currentStatus ? 'marked as ready' : 'unmarked from ready'}`);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error updating image ready status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setIsUpdating(prev => ({ ...prev, [imageId]: false }));
    }
  };

  const bulkToggleReadyStatus = async (toStatus: boolean) => {
    if (selectedImages.length === 0) {
      toast.error('No images selected');
      return;
    }

    const updatingIds = [...selectedImages];
    updatingIds.forEach(id => {
      setIsUpdating(prev => ({ ...prev, [id]: true }));
    });
    
    try {
      const { error } = await supabase
        .from('images')
        .update({ 
          ready_for_game: toStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', updatingIds);
        
      if (error) throw error;
      
      toast.success(`${updatingIds.length} images ${toStatus ? 'marked as ready' : 'unmarked from ready'}`);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error bulk updating images:', error);
      toast.error(`Failed to update images: ${error.message}`);
    } finally {
      updatingIds.forEach(id => {
        setIsUpdating(prev => ({ ...prev, [id]: false }));
      });
    }
  };

  const bulkDeleteImages = async () => {
    if (selectedImages.length === 0) {
      toast.error('No images selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedImages.length} selected images?`)) {
      return;
    }

    const deletingIds = [...selectedImages];
    deletingIds.forEach(id => {
      setIsDeleting(prev => ({ ...prev, [id]: true }));
    });
    
    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .in('id', deletingIds);
        
      if (error) throw error;
      
      toast.success(`${deletingIds.length} images deleted successfully`);
      setSelectedImages([]);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error bulk deleting images:', error);
      toast.error(`Failed to delete images: ${error.message}`);
    } finally {
      deletingIds.forEach(id => {
        setIsDeleting(prev => ({ ...prev, [id]: false }));
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 mx-auto mb-4">
          <RefreshCcw className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground">Loading images...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No images found</p>
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            className="mt-4"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh}
            size="sm"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
        
        {selectedImages.length > 0 && (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => bulkToggleReadyStatus(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark Ready
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => bulkToggleReadyStatus(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Unmark Ready
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={bulkDeleteImages}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}
        
        <span className="text-sm text-muted-foreground">
          {selectedImages.length === 0 ? 
            `${images.length} images` : 
            `${selectedImages.length} of ${images.length} selected`}
        </span>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
          {images.map((image) => {
            const isSelected = selectedImages.includes(image.id);
            return (
              <Card 
                key={image.id} 
                className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}
              >
                <div 
                  className="aspect-video relative cursor-pointer" 
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <img 
                    src={image.image_url || ''} 
                    alt={image.title || 'Image'} 
                    className="h-full w-full object-cover"
                  />
                  {image.ready_for_game && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500">Ready</Badge>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary">Selected</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium line-clamp-1">{image.title || 'Untitled'}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {image.description || 'No description'}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {image.year && (
                        <Badge variant="outline" className="text-xs">
                          {image.year}
                        </Badge>
                      )}
                      
                      {image.location && (
                        <Badge variant="outline" className="text-xs">
                          {image.location}
                        </Badge>
                      )}
                      
                      {image.is_ai_generated && (
                        <Badge variant="secondary" className="text-xs">
                          AI Generated
                        </Badge>
                      )}
                      
                      {image.source && (
                        <Badge variant="outline" className="text-xs">
                          {getProviderLabel(image.source)}
                        </Badge>
                      )}
                      
                      {image.is_mature_content && (
                        <Badge variant="destructive" className="text-xs">
                          Mature
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`flex items-center gap-1 ${
                          image.ready_for_game ? 'text-green-600' : 'text-red-600'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReadyStatus(image.id, image.ready_for_game);
                        }}
                        disabled={isUpdating[image.id]}
                      >
                        {isUpdating[image.id] ? (
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : image.ready_for_game ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        {image.ready_for_game ? 'Ready' : 'Not Ready'}
                      </Button>
                      
                      <div className="flex space-x-1">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewImage(image);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="text-red-500 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this image?')) {
                              deleteImage(image.id);
                            }
                          }}
                          disabled={isDeleting[image.id]}
                        >
                          {isDeleting[image.id] ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
      
      {selectedImage && (
        <FullscreenImageViewer 
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          image={formatImageForViewer(selectedImage)}
        />
      )}
    </div>
  );
};

export default SavedImagesGallery;
