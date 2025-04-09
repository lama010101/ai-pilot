
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Database, Download } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';

interface BackfillImagesButtonProps {
  onBackfillComplete?: () => void;
}

const BackfillImagesButton: React.FC<BackfillImagesButtonProps> = ({ onBackfillComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleBackfill = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulated API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate a successful response
      setResult("Successfully backfilled 25 images from external sources");
      
      if (onBackfillComplete) {
        onBackfillComplete();
      }
      
      toast.success("Image backfill complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred during backfill");
      toast.error("Image backfill failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Backfill Images</CardTitle>
        <CardDescription>
          Populate your image database with verified historical images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleBackfill} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Backfilling...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Backfill Verified Images
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BackfillImagesButton;
