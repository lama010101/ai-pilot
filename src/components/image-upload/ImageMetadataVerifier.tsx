
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageMetadataVerifierProps {
  imageUrl: string;
  imageId: string;
  onComplete?: (metadata: any) => void;
}

const ImageMetadataVerifier: React.FC<ImageMetadataVerifierProps> = ({
  imageUrl,
  imageId,
  onComplete
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const verifyImageMetadata = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      const response = await supabase.functions.invoke('image-metadata-verification', {
        body: { imageUrl, imageId }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to verify image metadata');
      }
      
      const verifiedMetadata = response.data.data;
      setMetadata(verifiedMetadata);
      
      toast({
        title: "Verification Complete",
        description: "Image metadata has been verified and stored",
      });
      
      if (onComplete) {
        onComplete(verifiedMetadata);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError(error.message || "An error occurred during verification");
      
      toast({
        title: "Verification Failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Format accuracy scores for display
  const formatAccuracyScore = (score: number) => {
    if (score >= 0.8) return { label: "High", color: "text-green-600" };
    if (score >= 0.6) return { label: "Medium", color: "text-yellow-600" };
    return { label: "Low", color: "text-red-600" };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Image Metadata Verification</CardTitle>
          <CardDescription>
            Verify and analyze image metadata using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-center h-48 bg-muted rounded-md overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Selected image" 
                  className="h-full w-auto object-contain"
                />
              ) : (
                <div className="text-muted-foreground">No image selected</div>
              )}
            </div>
            
            <Button 
              onClick={verifyImageMetadata} 
              disabled={isVerifying || !imageUrl}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Metadata...
                </>
              ) : (
                'Verify Image Metadata'
              )}
            </Button>
            
            {error && (
              <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            {metadata && (
              <div className="mt-4 space-y-4 p-4 border rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Basic Info</h3>
                    <div className="space-y-2 mt-2">
                      <p><span className="font-medium">Title:</span> {metadata.title}</p>
                      <p><span className="font-medium">Date:</span> {metadata.date}</p>
                      <p><span className="font-medium">Year:</span> {metadata.year}</p>
                      <p><span className="font-medium">Location:</span> {metadata.address}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Image Properties</h3>
                    <div className="space-y-2 mt-2">
                      <p>
                        <span className="font-medium">Historical:</span> 
                        {metadata.is_historical ? ' Yes' : ' No'}
                      </p>
                      <p>
                        <span className="font-medium">AI Generated:</span> 
                        {metadata.is_ai_generated ? ' Yes' : ' No'}
                      </p>
                      <p>
                        <span className="font-medium">Mature Content:</span> 
                        {metadata.is_mature_content ? ' Yes' : ' No'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="mt-2">{metadata.description}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Accuracy Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {Object.entries(metadata)
                      .filter(([key]) => key.startsWith('accuracy_'))
                      .map(([key, value]) => {
                        const { label, color } = formatAccuracyScore(value as number);
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="capitalize">{key.replace('accuracy_', '')}</span>
                            <span className={`font-medium ${color}`}>
                              {label} ({(value as number).toFixed(2)})
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageMetadataVerifier;
