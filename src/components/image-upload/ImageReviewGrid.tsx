
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X } from "lucide-react";
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
  const handleMetadataUpdate = (index: number, metadata: any) => {
    if (onImageMetadataUpdate) {
      onImageMetadataUpdate(index, metadata);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
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
                {image.metadata.title || "Missing"}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {image.metadata.description || "Missing"}
              </TableCell>
              <TableCell>
                {image.metadata.location || "Missing"}
              </TableCell>
              <TableCell>
                {image.metadata.date 
                  ? new Date(image.metadata.date).toLocaleDateString() 
                  : "Missing"}
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
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ImageReviewGrid;
