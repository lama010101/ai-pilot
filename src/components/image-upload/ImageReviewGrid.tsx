import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Save, Eye, Trash2, CheckSquare, RefreshCw } from "lucide-react";
import { ProcessedImage } from '@/types/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import FullscreenImageViewer from './FullscreenImageViewer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageReviewGridProps {
  images: ProcessedImage[];
  onToggleSelection: (index: number, selected: boolean) => void;
  onToggleReadyForGame: (index: number, ready: boolean) => void;
  onImageMetadataUpdate?: (index: number, metadata: any) => void;
}

const ImageReviewGrid: React.FC<ImageReviewGridProps> = ({
  images,
  onToggleSelection,
  onToggleReadyForGame,
  onImageMetadataUpdate
}) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    title?: string;
    description?: string;
    date?: string;
    year?: number;
    location?: string;
    country?: string;
  }>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
  
  const handleMetadataUpdate = (index: number, metadata: any) => {
    if (onImageMetadataUpdate) {
      onImageMetadataUpdate(index, metadata);
    }
  };
  
  const startEditing = (index: number) => {
    const image = images[index];
    setEditValues({
      title: image.metadata.title || '',
      description: image.metadata.description || '',
      date: image.metadata.date || '',
      year: image.metadata.year || undefined,
      location: image.metadata.location || '',
      country: image.metadata.country || '',
    });
    setEditIndex(index);
  };
  
  const saveEdits = (index: number) => {
    if (onImageMetadataUpdate) {
      const updatedMetadata = {
        ...images[index].metadata,
        ...editValues,
        manual_override: true
      };
      
      onImageMetadataUpdate(index, updatedMetadata);
    }
    setEditIndex(null);
  };
  
  const cancelEdits = () => {
    setEditIndex(null);
    setEditValues({});
  };
  
  const handleViewImage = (index: number) => {
    setSelectedImageIndex(index);
    setViewerOpen(true);
  };
  
  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  const bulkToggleReadyStatus = async (readyStatus: boolean) => {
    if (selectedRows.length === 0) {
      toast.error('No images selected');
      return;
    }
    
    const updating = { ...isUpdating };
    selectedRows.forEach(index => {
      updating[index] = true;
    });
    setIsUpdating(updating);
    
    try {
      for (const index of selectedRows) {
        onToggleReadyForGame(index, readyStatus);
      }
      
      toast.success(`Successfully ${readyStatus ? 'marked' : 'unmarked'} ${selectedRows.length} images`);
    } catch (error) {
      toast.error('Failed to update images');
      console.error('Error updating ready status:', error);
    } finally {
      const newUpdating = { ...isUpdating };
      selectedRows.forEach(index => {
        newUpdating[index] = false;
      });
      setIsUpdating(newUpdating);
    }
  };
  
  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  const formatImageForViewer = (image: ProcessedImage) => {
    return {
      url: image.imageUrl || '',
      mobileUrl: image.mobileUrl || image.imageUrl || '',
      tabletUrl: image.tabletUrl || image.imageUrl || '',
      desktopUrl: image.desktopUrl || image.imageUrl || '',
      title: image.metadata.title || '',
      description: image.metadata.description || '',
      date: image.metadata.date || null,
      year: image.metadata.year || null,
      location: image.metadata.location || null,
      country: image.metadata.country || null,
      is_true_event: image.metadata.is_true_event || false,
      is_ai_generated: image.metadata.is_ai_generated || false,
      is_mature_content: image.metadata.is_mature_content || false,
      source: image.metadata.source || '',
      gps: image.metadata.gps,
      accuracy_description: image.metadata.accuracy_description,
      accuracy_date: image.metadata.accuracy_date,
      accuracy_location: image.metadata.accuracy_location,
      accuracy_historical: image.metadata.accuracy_historical,
      accuracy_realness: image.metadata.accuracy_realness,
      accuracy_maturity: image.metadata.accuracy_maturity
    };
  };

  return (
    <div className="space-y-4">
      {selectedRows.length > 0 && (
        <div className="flex justify-between items-center bg-muted p-2 rounded-md">
          <span>{selectedRows.length} images selected</span>
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
          </div>
        </div>
      )}
      
      <div className="overflow-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead className="w-40">Image</TableHead>
              <TableHead className="w-40">Description</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date/Year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-24">Ready</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {images.map((image, index) => (
              <TableRow key={image.originalFileName} className={selectedRows.includes(index) ? 'bg-primary/10' : ''}>
                <TableCell>
                  <Checkbox 
                    checked={selectedRows.includes(index)}
                    onCheckedChange={() => toggleRowSelection(index)}
                  />
                </TableCell>
                <TableCell>
                  <div className="h-20 w-24 relative cursor-pointer" onClick={() => handleViewImage(index)}>
                    <img 
                      src={image.imageUrl} 
                      alt="Event" 
                      className="h-full w-full object-cover rounded-md"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-20 w-24 relative cursor-pointer" onClick={() => handleViewImage(index)}>
                    <img 
                      src={image.descriptionImageUrl} 
                      alt="Description" 
                      className="h-full w-full object-contain rounded-md"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {editIndex === index ? (
                    <Input
                      value={editValues.title}
                      onChange={(e) => setEditValues({...editValues, title: e.target.value})}
                      className="w-full"
                    />
                  ) : (
                    image.metadata.title || "Missing"
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {editIndex === index ? (
                    <Textarea
                      value={editValues.description}
                      onChange={(e) => setEditValues({...editValues, description: e.target.value})}
                      className="w-full"
                      rows={3}
                    />
                  ) : (
                    <div className="truncate">{image.metadata.description || "Missing"}</div>
                  )}
                </TableCell>
                <TableCell>
                  {editIndex === index ? (
                    <div className="space-y-2">
                      <Input
                        value={editValues.location}
                        onChange={(e) => setEditValues({...editValues, location: e.target.value})}
                        className="w-full"
                        placeholder="Location"
                      />
                      <Input
                        value={editValues.country}
                        onChange={(e) => setEditValues({...editValues, country: e.target.value})}
                        className="w-full"
                        placeholder="Country"
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{image.metadata.location || "Location missing"}</div>
                      {image.metadata.country && (
                        <Badge variant="outline" className="mt-1">
                          {image.metadata.country}
                        </Badge>
                      )}
                      {image.metadata.gps && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {image.metadata.gps.lat}, {image.metadata.gps.lng}
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editIndex === index ? (
                    <div className="space-y-2">
                      <Input
                        value={editValues.date}
                        onChange={(e) => setEditValues({...editValues, date: e.target.value})}
                        className="w-full"
                        placeholder="YYYY-MM-DD"
                      />
                      <Input
                        value={editValues.year?.toString() || ''}
                        onChange={(e) => setEditValues({...editValues, year: parseInt(e.target.value) || undefined})}
                        className="w-full"
                        placeholder="Year"
                        type="number"
                      />
                    </div>
                  ) : (
                    <div>
                      {image.metadata.date ? (
                        <div>{image.metadata.date}</div>
                      ) : image.metadata.year ? (
                        <div>Year: {image.metadata.year}</div>
                      ) : (
                        "Missing"
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    image.metadata.is_ai_generated 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {image.metadata.is_ai_generated ? 'AI Generated' : 'Real Event'}
                  </span>
                  {image.metadata.is_true_event && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 ml-1">
                      Historical
                    </span>
                  )}
                  {image.metadata.source && (
                    <Badge variant="outline" className="ml-1">
                      {image.metadata.source}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`w-full flex items-center justify-center gap-1 ${
                      image.ready_for_game ? 'text-green-600' : 'text-red-600'
                    }`}
                    onClick={() => onToggleReadyForGame(index, !image.ready_for_game)}
                    disabled={isUpdating[index]}
                  >
                    {isUpdating[index] ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : image.ready_for_game ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    {image.ready_for_game ? 'Ready' : 'Not Ready'}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button size="icon" variant="outline" onClick={() => handleViewImage(index)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {editIndex === index ? (
                      <>
                        <Button size="icon" variant="outline" onClick={() => saveEdits(index)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={cancelEdits}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="icon" variant="outline" onClick={() => startEditing(index)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
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

export default ImageReviewGrid;
