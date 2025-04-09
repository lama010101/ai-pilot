
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
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
  const [logs, setLogs] = useState<string[]>([]);
  const [progressStage, setProgressStage] = useState(0); // 0-3 for the 4 stages
  const { toast } = useToast();

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const verifyImageMetadata = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      setProgressStage(0);
      addLog("Starting image metadata verification...");
      
      // Make sure we have a properly encoded URL
      const processedImageUrl = encodeURIComponent(imageUrl);
      addLog(`Prepared image URL for processing: ${imageUrl.substring(0, 20)}...`);
      
      // Set the first progress stage
      setProgressStage(1);
      addLog("Sending request to verification function...");
      
      // Call the edge function with the full public URL of the image
      const response = await supabase.functions.invoke('image-metadata-verification', {
        body: { 
          imageUrl: imageUrl,
          imageId: imageId
        }
      });
      
      setProgressStage(2);
      
      if (response.error) {
        console.error("Function error:", response.error);
        throw new Error(response.error.message || 'Failed to verify image metadata');
      }
      
      addLog("Received verification results successfully");
      const verifiedMetadata = response.data.data;
      setMetadata(verifiedMetadata);
      
      setProgressStage(3);
      addLog(`Verification complete: ${verifiedMetadata.title}`);
      
      toast({
        title: "Verification Complete",
        description: "Image metadata has been verified and stored",
      });
      
      // Store metadata to local storage for persistence across page reloads
      try {
        const existingData = JSON.parse(localStorage.getItem('verifiedImagesMetadata') || '{}');
        existingData[imageId] = verifiedMetadata;
        localStorage.setItem('verifiedImagesMetadata', JSON.stringify(existingData));
      } catch (e) {
        console.warn("Could not save metadata to localStorage", e);
      }
      
      if (onComplete) {
        onComplete(verifiedMetadata);
      }
    } catch (error) {
      console.error("Verification error:", error);
      addLog(`ERROR: ${error.message || "Unknown verification error"}`);
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

  // Check if metadata was loaded from localStorage
  React.useEffect(() => {
    try {
      const savedMetadata = JSON.parse(localStorage.getItem('verifiedImagesMetadata') || '{}');
      if (savedMetadata[imageId]) {
        setMetadata(savedMetadata[imageId]);
        addLog("Loaded previously verified metadata from local storage");
      }
    } catch (e) {
      console.warn("Could not load metadata from localStorage", e);
    }
  }, [imageId]);

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
            
            {/* Progress indicator */}
            {isVerifying && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Verification in progress</span>
                  <span>{Math.round((progressStage / 3) * 100)}%</span>
                </div>
                <Progress value={(progressStage / 3) * 100} />
              </div>
            )}
            
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
            
            {/* Processing Logs */}
            {logs.length > 0 && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md text-sm font-mono overflow-y-auto max-h-40">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 mr-2" />
                  <span className="font-medium">Processing Log</span>
                </div>
                {logs.map((log, i) => (
                  <div key={i} className="text-xs">{log}</div>
                ))}
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
                      <p>
                        <span className="font-medium">Manual Override:</span> 
                        {metadata.manual_override ? ' Yes' : ' No'}
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
