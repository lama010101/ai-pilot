
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileArchive, Loader2, FileSpreadsheet } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ImageUploaderProps {
  onUpload: (eventZipFile: File, descZipFile: File) => void;
  onMetadataFileSelect?: (file: File | null) => void;
  isUploading: boolean;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUpload, 
  onMetadataFileSelect,
  isUploading,
  isProcessing 
}) => {
  const [eventZipFile, setEventZipFile] = useState<File | null>(null);
  const [descZipFile, setDescZipFile] = useState<File | null>(null);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const eventInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);
  const metadataInputRef = useRef<HTMLInputElement>(null);

  const triggerEventFileSelect = () => {
    if (eventInputRef.current) {
      eventInputRef.current.click();
    }
  };

  const triggerDescFileSelect = () => {
    if (descInputRef.current) {
      descInputRef.current.click();
    }
  };
  
  const triggerMetadataFileSelect = () => {
    if (metadataInputRef.current) {
      metadataInputRef.current.click();
    }
  };

  const handleEventFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.name.endsWith('.zip')) {
      setEventZipFile(file);
    } else {
      setEventZipFile(null);
      e.target.value = '';
    }
  };

  const handleDescFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.name.endsWith('.zip')) {
      setDescZipFile(file);
    } else {
      setDescZipFile(null);
      e.target.value = '';
    }
  };
  
  const handleMetadataFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      setMetadataFile(file);
      if (onMetadataFileSelect) {
        onMetadataFileSelect(file);
      }
    } else {
      setMetadataFile(null);
      if (onMetadataFileSelect) {
        onMetadataFileSelect(null);
      }
      e.target.value = '';
    }
  };

  const handleSubmit = () => {
    if (eventZipFile && descZipFile) {
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);
      
      onUpload(eventZipFile, descZipFile);
      
      // Stop the progress animation after upload completes
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
      }, 5000);
    }
  };

  const isReadyToUpload = eventZipFile && descZipFile && !isUploading && !isProcessing;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-dashed cursor-pointer hover:bg-muted/50 transition">
          <CardContent 
            className="flex flex-col items-center justify-center p-6 space-y-4"
            onClick={triggerEventFileSelect}
          >
            <input
              type="file"
              accept=".zip"
              ref={eventInputRef}
              onChange={handleEventFileChange}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileArchive className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-medium">Events ZIP File</h3>
              <p className="text-sm text-muted-foreground">
                {eventZipFile 
                  ? `Selected: ${eventZipFile.name} (${(eventZipFile.size / (1024 * 1024)).toFixed(2)} MB)` 
                  : 'Upload a ZIP file containing event images'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed cursor-pointer hover:bg-muted/50 transition">
          <CardContent 
            className="flex flex-col items-center justify-center p-6 space-y-4"
            onClick={triggerDescFileSelect}
          >
            <input
              type="file"
              accept=".zip"
              ref={descInputRef}
              onChange={handleDescFileChange}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileArchive className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-medium">Descriptions ZIP File</h3>
              <p className="text-sm text-muted-foreground">
                {descZipFile 
                  ? `Selected: ${descZipFile.name} (${(descZipFile.size / (1024 * 1024)).toFixed(2)} MB)` 
                  : 'Upload a ZIP file containing description images'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-dashed cursor-pointer hover:bg-muted/50 transition">
          <CardContent 
            className="flex flex-col items-center justify-center p-6 space-y-4"
            onClick={triggerMetadataFileSelect}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={metadataInputRef}
              onChange={handleMetadataFileChange}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-medium">Metadata File (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                {metadataFile 
                  ? `Selected: ${metadataFile.name} (${(metadataFile.size / (1024 * 1024)).toFixed(2)} MB)` 
                  : 'Upload an Excel/CSV file with metadata'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {(isUploading || isProcessing) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {isUploading ? 'Uploading files...' : 'Processing images...'}
            </span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Button 
          className="w-full md:w-auto" 
          size="lg"
          onClick={handleSubmit}
          disabled={!isReadyToUpload}
        >
          {isUploading || isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isProcessing ? 'Processing Images...' : 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Process ZIP Files
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ImageUploader;
