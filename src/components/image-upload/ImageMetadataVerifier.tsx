
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageMetadataVerifierProps {
  imageUrl?: string;
  imageId?: string;
  onVerificationComplete?: (results: any) => void;
  onComplete?: (results: any) => void;
}

const ImageMetadataVerifier: React.FC<ImageMetadataVerifierProps> = ({ 
  imageUrl,
  imageId,
  onVerificationComplete,
  onComplete
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyMetadata = async () => {
    if (!imageUrl) {
      toast.error("No image URL provided for verification");
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // Simulate AI verification process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResults = {
        truthScore: 0.87,
        realnessScore: 0.92,
        metadataConsistency: 0.89,
        findings: [
          { key: "Date", inference: "1950s", metadata: "1955", consistent: true },
          { key: "Location", inference: "New York", metadata: "New York", consistent: true },
          { key: "Subject", inference: "Street scene", metadata: "Urban landscape", consistent: true }
        ]
      };
      
      setResults(mockResults);
      
      if (onVerificationComplete) {
        onVerificationComplete(mockResults);
      }
      
      if (onComplete) {
        onComplete(mockResults);
      }
      
      toast.success("Image metadata verification complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error during verification");
      toast.error("Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Metadata Verification</CardTitle>
        <CardDescription>
          Verify image metadata using AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!imageUrl && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No image selected for verification. Please upload or select an image first.
            </AlertDescription>
          </Alert>
        )}
        
        {results && (
          <div className="space-y-3 bg-muted p-4 rounded-md">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Truth Score:</span>
              <span className="text-sm">{results.truthScore.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Realness Score:</span>
              <span className="text-sm">{results.realnessScore.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Metadata Consistency:</span>
              <span className="text-sm">{results.metadataConsistency.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-sm font-medium mb-2">Findings:</p>
              <ul className="space-y-1">
                {results.findings.map((finding: any, index: number) => (
                  <li key={index} className="text-xs flex items-center">
                    {finding.consistent ? (
                      <Check className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-amber-500 mr-1" />
                    )}
                    <span>{finding.key}: Inferred "{finding.inference}" vs Metadata "{finding.metadata}"</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleVerifyMetadata} 
          disabled={isVerifying || !imageUrl}
          className="w-full"
        >
          {isVerifying ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Verifying...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Verify Image Metadata
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ImageMetadataVerifier;
