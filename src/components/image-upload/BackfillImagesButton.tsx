
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BackfillResult {
  processed: number;
  metadata_updated: number;
  images_updated: number;
  failures: number;
  details: string[];
}

interface BackfillImagesButtonProps {
  onComplete?: (result: BackfillResult) => void;
}

const BackfillImagesButton: React.FC<BackfillImagesButtonProps> = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBackfill = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Starting Backfill Process",
        description: "Updating metadata and creating responsive images for existing images..."
      });

      const response = await supabase.functions.invoke('image-metadata-verification', {
        body: { backfillMode: true }
      });

      if (response.error) {
        throw new Error(response.error.message || "Backfill process failed");
      }

      const result = response.data.data as BackfillResult;
      
      toast({
        title: "Backfill Complete",
        description: `Processed ${result.processed} images. Updated metadata: ${result.metadata_updated}, Created responsive images: ${result.images_updated}, Failures: ${result.failures}`
      });

      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error("Error during backfill:", error);
      toast({
        title: "Backfill Failed",
        description: error.message || "An error occurred during the backfill process",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleBackfill} 
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing Images...
        </>
      ) : (
        <>
          <RefreshCcw className="h-4 w-4" />
          Backfill Existing Images
        </>
      )}
    </Button>
  );
};

export default BackfillImagesButton;
