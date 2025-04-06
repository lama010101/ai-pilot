
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Save } from "lucide-react";
import { ProcessedImage } from '@/pages/ImageUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImageProcessingButton from './ImageProcessingButton';

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
  }>({});
  
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
  
  // Check if an image has been verified (has accuracy scores)
  const isVerified = (image: ProcessedImage) => {
    return Object.keys(image.metadata).some(key => key.startsWith('accuracy_'));
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
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-24">Ready</TableHead>
              <TableHead className="w-28">Actions</TableHead>
              <TableHead className="w-16">Edit</TableHead>
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
                  <div className="h-20 w-24 relative">
                    <img 
                      src={image.imageUrl} 
                      alt="Event" 
                      className="h-full w-full object-cover rounded-md"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-20 w-24 relative">
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
                    <Input
                      value={editValues.location}
                      onChange={(e) => setEditValues({...editValues, location: e.target.value})}
                      className="w-full"
                    />
                  ) : (
                    image.metadata.location || "Missing"
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
                    image.metadata.date 
                      ? new Date(image.metadata.date).toLocaleDateString() 
                      : "Missing"
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
                  <ImageProcessingButton 
                    image={{
                      id: image.originalFileName,
                      imageUrl: image.imageUrl
                    }}
                    onProcessingComplete={(metadata) => handleMetadataUpdate(index, metadata)}
                    isVerified={isVerified(image)}
                  />
                </TableCell>
                <TableCell>
                  {editIndex === index ? (
                    <div className="flex space-x-1">
                      <Button size="icon" variant="outline" onClick={() => saveEdits(index)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={cancelEdits}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="outline" onClick={() => startEditing(index)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ImageReviewGrid;
