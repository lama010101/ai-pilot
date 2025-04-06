
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileSearch, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageMetadataVerifier from './ImageMetadataVerifier';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface ImageProcessingButtonProps {
  image: {
    id: string;
    imageUrl: string;
  };
  onProcessingComplete?: (result: any) => void;
  isVerified?: boolean;
}

const ImageProcessingButton: React.FC<ImageProcessingButtonProps> = ({
  image,
  onProcessingComplete,
  isVerified = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasVerified, setHasVerified] = useState(isVerified);
  const { toast } = useToast();

  // Load verification status from localStorage on mount
  useEffect(() => {
    try {
      const savedMetadata = JSON.parse(localStorage.getItem('verifiedImagesMetadata') || '{}');
      if (savedMetadata[image.id]) {
        setHasVerified(true);
      }
    } catch (e) {
      console.warn("Could not load metadata status from localStorage", e);
    }
  }, [image.id]);

  const handleOpenDialog = () => {
    setIsOpen(true);
  };

  const handleVerificationComplete = (metadata: any) => {
    setIsProcessing(false);
    setHasVerified(true);
    
    // Store verification status
    try {
      const verifiedIds = JSON.parse(localStorage.getItem('verifiedImageIds') || '[]');
      if (!verifiedIds.includes(image.id)) {
        verifiedIds.push(image.id);
        localStorage.setItem('verifiedImageIds', JSON.stringify(verifiedIds));
      }
    } catch (e) {
      console.warn("Could not save verification status to localStorage", e);
    }
    
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleOpenDialog}
              variant={hasVerified ? "default" : "outline"}
              size="sm"
              className="flex items-center"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : hasVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verified
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4 mr-2" />
                  Verify Metadata
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasVerified ? "Metadata has been verified" : "Click to verify image metadata"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
