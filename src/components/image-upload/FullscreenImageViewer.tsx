
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download, Info, MapPin, Calendar } from "lucide-react";
import { ImageDataDB } from '@/types/supabase';

interface FullscreenImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImageDataDB | null;
}

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({
  isOpen,
  onClose,
  image
}) => {
  if (!image) return null;

  const formatAccuracy = (score: number | null) => {
    if (!score && score !== 0) return "N/A";
    const percentage = Math.round((score || 0) * 100);
    return `${percentage}%`;
  };

  const displayGpsCoordinates = (gps: any | null): string => {
    if (!gps) return "N/A";
    
    try {
      if (typeof gps === 'object' && gps !== null) {
        if (gps.lat !== undefined && (gps.lon !== undefined || gps.lng !== undefined)) {
          const lon = gps.lon !== undefined ? gps.lon : gps.lng;
          return `${gps.lat}, ${lon}`;
        }
        if (Array.isArray(gps) && gps.length >= 2) {
          return `${gps[0]}, ${gps[1]}`;
        }
      }
      return JSON.stringify(gps);
    } catch (e) {
      console.error("Error parsing GPS data:", e);
      return "Invalid GPS data";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[1200px] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Image Panel */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            {image.image_url ? (
              <img 
                src={image.image_url} 
                alt={image.title || "Image"} 
                className="max-h-[95vh] max-w-full object-contain"
              />
            ) : (
              <div className="text-white/50">No image available</div>
            )}
          </div>
          
          {/* Info Panel */}
          <div className="w-[350px] bg-background border-l">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">{image.title || "Untitled"}</DialogTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <ScrollArea className="h-[calc(95vh-70px)] p-4">
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {image.detailed_description || image.description || "No description available"}
                  </p>
                  
                  {image.short_description && (
                    <div className="mt-2 p-2 bg-muted rounded-md">
                      <p className="text-sm italic">{image.short_description}</p>
                    </div>
                  )}
                </div>
                
                {/* Metadata */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Date/Year</span>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{image.date || (image.year ? `Year: ${image.year}` : "Unknown")}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Location</span>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="truncate" title={image.location || "Unknown"}>
                          {image.location || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {image.country && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Country</span>
                      <p>{image.country}</p>
                    </div>
                  )}
                  
                  {image.gps && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">GPS Coordinates</span>
                      <p className="font-mono text-sm">{displayGpsCoordinates(image.gps)}</p>
                    </div>
                  )}
                </div>
                
                {/* Hints */}
                {image.hints && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Hints</h3>
                    <div className="space-y-2">
                      {image.hints.hint_1 && (
                        <div className="p-2 bg-muted rounded-md">
                          <p className="text-sm font-medium">Hint 1 (Vague)</p>
                          <p className="text-sm">{image.hints.hint_1}</p>
                        </div>
                      )}
                      
                      {image.hints.hint_2 && (
                        <div className="p-2 bg-muted rounded-md">
                          <p className="text-sm font-medium">Hint 2 (More Precise)</p>
                          <p className="text-sm">{image.hints.hint_2}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Properties */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Properties</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={image.is_true_event ? "secondary" : "outline"}>
                      {image.is_true_event ? "Historical Event" : "Fictional"}
                    </Badge>
                    
                    <Badge variant={image.is_ai_generated ? "default" : "outline"}>
                      {image.is_ai_generated ? "AI Generated" : "Real Image"}
                    </Badge>
                    
                    {image.is_mature_content && (
                      <Badge variant="destructive">Mature Content</Badge>
                    )}
                    
                    {image.ready_for_game && (
                      <Badge variant="success" className="bg-green-600">Ready for Game</Badge>
                    )}
                    
                    {image.source && (
                      <Badge variant="outline">
                        Source: {image.source}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Accuracy Scores */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Accuracy Scores</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex justify-between items-center">
                      <span>Description:</span>
                      <span>{formatAccuracy(image.accuracy_description)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Date:</span>
                      <span>{formatAccuracy(image.accuracy_date)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Location:</span>
                      <span>{formatAccuracy(image.accuracy_location)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Historical:</span>
                      <span>{formatAccuracy(image.accuracy_historical)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Realness:</span>
                      <span>{formatAccuracy(image.accuracy_realness)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Maturity:</span>
                      <span>{formatAccuracy(image.accuracy_maturity)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Image Details */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Image Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(image.created_at || '').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span>{new Date(image.updated_at || '').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono text-xs truncate">{image.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenImageViewer;
