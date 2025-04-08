
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Image, Check, X, Info } from "lucide-react";

interface ImageMetadata {
  title?: string;
  description?: string;
  date?: string;
  year?: number;
  address?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_true_event?: boolean;
  is_ai_generated?: boolean;
  is_mature_content?: boolean;
  source?: string;
  accuracy_description?: number;
  accuracy_date?: number;
  accuracy_location?: number;
  accuracy_historical?: number;
  accuracy_realness?: number;
  accuracy_maturity?: number;
}

interface FullscreenImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  image: {
    url: string;
    mobileUrl?: string;
    tabletUrl?: string;
    desktopUrl?: string;
    metadata: ImageMetadata;
  } | null;
}

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({
  isOpen,
  onClose,
  image
}) => {
  if (!image) return null;

  const formatCoordinates = (lat?: number, lng?: number) => {
    if (!lat || !lng) return 'Not available';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatAccuracyScore = (score?: number) => {
    if (score === undefined || score === null) return { label: "Unknown", color: "text-gray-500" };
    if (score >= 0.8) return { label: "High", color: "text-green-600" };
    if (score >= 0.6) return { label: "Medium", color: "text-yellow-600" };
    return { label: "Low", color: "text-red-600" };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{image.metadata.title || 'Image Details'}</DialogTitle>
          <DialogDescription>
            {image.metadata.description?.substring(0, 100)}
            {image.metadata.description && image.metadata.description.length > 100 ? '...' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
          {/* Image Column */}
          <div className="md:col-span-3 space-y-4">
            <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
              <img 
                src={image.url} 
                alt={image.metadata.title || 'Image'} 
                className="w-full h-full object-contain"
              />
              
              {image.metadata.is_ai_generated && (
                <Badge variant="secondary" className="absolute top-2 right-2">
                  AI Generated
                </Badge>
              )}
              
              {image.metadata.is_mature_content && (
                <Badge variant="destructive" className="absolute top-2 left-2">
                  Mature Content
                </Badge>
              )}
            </div>
            
            {/* Responsive Versions */}
            {(image.mobileUrl || image.tabletUrl || image.desktopUrl) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Responsive Versions</h4>
                <div className="grid grid-cols-3 gap-2">
                  {image.mobileUrl && (
                    <div className="space-y-1">
                      <div className="aspect-[9/16] bg-muted rounded-md overflow-hidden">
                        <img 
                          src={image.mobileUrl} 
                          alt="Mobile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Mobile</p>
                    </div>
                  )}
                  
                  {image.tabletUrl && (
                    <div className="space-y-1">
                      <div className="aspect-square bg-muted rounded-md overflow-hidden">
                        <img 
                          src={image.tabletUrl} 
                          alt="Tablet" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Tablet</p>
                    </div>
                  )}
                  
                  {image.desktopUrl && (
                    <div className="space-y-1">
                      <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        <img 
                          src={image.desktopUrl} 
                          alt="Desktop" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Desktop</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Metadata Column */}
          <div className="md:col-span-2 space-y-4">
            {/* Event Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Event Information</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {image.metadata.date || (image.metadata.year ? `Year ${image.metadata.year}` : 'Unknown')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {image.metadata.address || 'Unknown location'}
                    </p>
                    {image.metadata.country && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Country: {image.metadata.country}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      GPS: {formatCoordinates(image.metadata.latitude, image.metadata.longitude)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Source</p>
                    <p className="text-sm text-muted-foreground">
                      {image.metadata.source || 'Unknown source'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Event Properties */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Properties</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 flex items-center justify-center">
                    {image.metadata.is_true_event ? 
                      <Check className="h-4 w-4 text-green-500" /> : 
                      <X className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-sm">True Historical Event</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 flex items-center justify-center">
                    {image.metadata.is_ai_generated ? 
                      <Check className="h-4 w-4 text-blue-500" /> : 
                      <X className="h-4 w-4 text-gray-500" />}
                  </div>
                  <p className="text-sm">AI Generated</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 flex items-center justify-center">
                    {image.metadata.is_mature_content ? 
                      <Check className="h-4 w-4 text-amber-500" /> : 
                      <X className="h-4 w-4 text-gray-500" />}
                  </div>
                  <p className="text-sm">Mature Content</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Accuracy Scores */}
            {(image.metadata.accuracy_description !== undefined || 
              image.metadata.accuracy_date !== undefined || 
              image.metadata.accuracy_location !== undefined) && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Accuracy Scores</h3>
                  <Info className="h-4 w-4 text-muted-foreground ml-2" />
                </div>
                
                <div className="space-y-2">
                  {[
                    { label: 'Description', value: image.metadata.accuracy_description },
                    { label: 'Date', value: image.metadata.accuracy_date },
                    { label: 'Location', value: image.metadata.accuracy_location },
                    { label: 'Historical', value: image.metadata.accuracy_historical },
                    { label: 'Realness', value: image.metadata.accuracy_realness },
                    { label: 'Maturity', value: image.metadata.accuracy_maturity }
                  ].map((accuracy, index) => {
                    if (accuracy.value === undefined) return null;
                    const { label, color } = formatAccuracyScore(accuracy.value);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{accuracy.label}</span>
                        <span className={`text-sm font-medium ${color}`}>
                          {label} ({(accuracy.value * 100).toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {image.metadata.description && (
              <>
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Full Description</h3>
                  <p className="text-sm whitespace-pre-line">{image.metadata.description}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenImageViewer;
