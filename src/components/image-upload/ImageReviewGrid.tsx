
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Save, Eye } from "lucide-react";
import { ProcessedImage } from '@/pages/ImageUpload';
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
import { ImageDB } from '@/lib/supabaseTypes';

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
      // Create updated metadata with manual_override flag
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
  
  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  const formatAsImageDB = (image: ProcessedImage): ImageDB => {
    return {
      id: image.originalFileName || '',
      title: image.metadata.title || null,
      description: image.metadata.description || null,
      date: image.metadata.date || null,
      year: image.metadata.year || null,
      location: image.metadata.location || null,
      gps: image.metadata.gps || null,
      is_true_event: image.metadata.is_true_event || false,
      is_ai_generated: image.metadata.is_ai_generated || true,
      ready_for_game: image.ready_for_game || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: image.imageUrl || null,
      description_image_url: image.descriptionImageUrl || null,
      is_mature_content: image.metadata.is_mature_content || false,
      accuracy_description: image.metadata.accuracy_description || 1.0,
      accuracy_date: image.metadata.accuracy_date || 1.0,
      accuracy_location: image.metadata.accuracy_location || 1.0,
      accuracy_historical: image.metadata.accuracy_historical || 1.0,
      accuracy_realness: image.metadata.accuracy_realness || 1.0,
      accuracy_maturity: image.metadata.accuracy_maturity || 1.0,
      manual_override: image.metadata.manual_override || false,
      source: image.metadata.source || 'manual',
      hints: image.metadata.hints || null,
      country: image.metadata.country || null,
      short_description: image.metadata.short_description || null,
      detailed_description: image.metadata.detailed_description || null
    };
  };

  return (
    <div className="space-y-4">
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
              <TableRow key={image.originalFileName}>
                <TableCell>
                  <Checkbox 
                    checked={image.selected}
                    onCheckedChange={(checked) => onToggleSelection(index, !!checked)}
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
                          {image.metadata.gps.lat}, {image.metadata.gps.lng || image.metadata.gps.lon}
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
                  <div 
                    className={`flex items-center justify-center h-8 w-8 rounded-full cursor-pointer ${
                      image.ready_for_game 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                    }`}
                    onClick={() => onToggleReadyForGame(index, !image.ready_for_game)}
                  >
                    {image.ready_for_game ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>
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
          image={formatAsImageDB(selectedImage)}
        />
      )}
    </div>
  );
};

export default ImageReviewGrid;
