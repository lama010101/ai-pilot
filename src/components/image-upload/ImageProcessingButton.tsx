
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageMetadataVerifier from './ImageMetadataVerifier';

interface ImageProcessingButtonProps {
  image: {
    id: string;
    imageUrl: string;
  };
  onProcessingComplete?: (result: any) => void;
}

const ImageProcessingButton: React.FC<ImageProcessingButtonProps> = ({
  image,
  onProcessingComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = () => {
    setIsOpen(true);
  };

  const handleVerificationComplete = (metadata: any) => {
    setIsProcessing(false);
    
    if (onProcessingComplete) {
      onProcessingComplete(metadata);
    }
    
    // Close dialog after a short delay
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        variant="outline"
        size="sm"
        className="flex items-center"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <FileSearch className="h-4 w-4 mr-2" />
            Verify Metadata
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Image Metadata Verification</DialogTitle>
            <DialogDescription>
              Analyze this image using AI to extract and verify metadata
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ImageMetadataVerifier 
              imageUrl={image.imageUrl}
              imageId={image.id}
              onComplete={handleVerificationComplete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageProcessingButton;
