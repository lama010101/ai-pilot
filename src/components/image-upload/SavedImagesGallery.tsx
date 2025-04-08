
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Eye,
  Calendar,
  MapPin,
  RefreshCw,
  ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { ImageDB } from "@/lib/supabaseTypes";
import FullscreenImageViewer from './FullscreenImageViewer';

interface SavedImage {
  id: string;
  title: string | null;
  description: string | null;
  date: string | null;
  year: number | null;
  location: string | null;
  gps: Json | null;
  is_true_event: boolean | null;
  is_ai_generated: boolean | null;
  is_mature_content: boolean | null;
  ready_for_game: boolean | null;
  image_url: string | null;
  description_image_url: string | null;
  image_mobile_url: string | null;
  image_tablet_url: string | null;
  image_desktop_url: string | null;
  accuracy_description: number | null;
  accuracy_date: number | null;
  accuracy_location: number | null;
  accuracy_historical: number | null;
  accuracy_realness: number | null;
  accuracy_maturity: number | null;
  manual_override: boolean | null;
  source: string | null;
  hints: any | null;
  country: string | null;
  short_description: string | null;
  detailed_description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const SavedImagesGallery = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [viewerOpen, setViewerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedImages();
  }, []);

  const fetchSavedImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const typedImages: SavedImage[] = (data as ImageDB[]).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        date: item.date,
        year: item.year,
        location: item.location,
        gps: item.gps,
        is_true_event: item.is_true_event,
        is_ai_generated: item.is_ai_generated,
        ready_for_game: item.ready_for_game,
        image_url: item.image_url,
        description_image_url: item.description_image_url,
        image_mobile_url: item.image_mobile_url,
        image_tablet_url: item.image_tablet_url,
        image_desktop_url: item.image_desktop_url,
        is_mature_content: item.is_mature_content ?? null,
        accuracy_description: item.accuracy_description ?? null,
        accuracy_date: item.accuracy_date ?? null,
        accuracy_location: item.accuracy_location ?? null,
        accuracy_historical: item.accuracy_historical ?? null,
        accuracy_realness: item.accuracy_realness ?? null,
        accuracy_maturity: item.accuracy_maturity ?? null,
        manual_override: item.manual_override ?? null,
        source: item.source ?? null,
        hints: item.hints ?? null,
        country: item.country ?? null,
        short_description: item.short_description ?? null,
        detailed_description: item.detailed_description ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setImages(typedImages);
      
      toast({
        title: "Images loaded",
        description: `Found ${typedImages.length} saved images`,
      });
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Failed to load images",
        description: error.message || "Could not fetch saved images",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewImage = (image: SavedImage) => {
    setSelectedImage(image);
    setViewerOpen(true);
  };

  const formatAccuracy = (score: number) => {
    if (!score && score !== 0) return "N/A";
    
    const percentage = Math.round(score * 100);
    let color = "text-red-500";
    
    if (percentage >= 80) {
      color = "text-green-500";
    } else if (percentage >= 60) {
      color = "text-yellow-500";
    }
    
    return <span className={color}>{percentage}%</span>;
  };

  const filteredImages = React.useMemo(() => {
    if (activeTab === "all") return images;
    if (activeTab === "ready") return images.filter(img => img.ready_for_game);
    if (activeTab === "historical") return images.filter(img => img.is_true_event);
    if (activeTab === "ai") return images.filter(img => img.is_ai_generated);
    if (activeTab === "mature") return images.filter(img => img.is_mature_content);
    return images;
  }, [images, activeTab]);

  const displayGpsCoordinates = (gps: Json | null): string => {
    if (!gps) return "N/A";
    
    try {
      if (typeof gps === 'object' && gps !== null) {
        const gpsObj = gps as Record<string, any>;
        if (gpsObj.lat !== undefined && (gpsObj.lon !== undefined || gpsObj.lng !== undefined)) {
          const lon = gpsObj.lon !== undefined ? gpsObj.lon : gpsObj.lng;
          return `${gpsObj.lat}, ${lon}`;
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

  const formatImageForViewer = (image: SavedImage) => {
    let latitude = null;
    let longitude = null;
    
    if (image.gps) {
      try {
        const gpsObj = typeof image.gps === 'object' ? image.gps : JSON.parse(image.gps as string);
        if (gpsObj.lat !== undefined) {
          latitude = gpsObj.lat;
          longitude = gpsObj.lng || gpsObj.lon;
        } else if (Array.isArray(gpsObj) && gpsObj.length >= 2) {
          latitude = gpsObj[0];
          longitude = gpsObj[1];
        }
      } catch (e) {
        console.error("Error parsing GPS data:", e);
      }
    }
    
    return {
      url: image.image_url || '',
      mobileUrl: image.image_mobile_url || undefined,
      tabletUrl: image.image_tablet_url || undefined,
      desktopUrl: image.image_desktop_url || undefined,
      title: image.title || '',
      description: image.description || '',
      date: image.date || null,
      year: image.year || null,
      location: image.location || null,
      country: image.country || null,
      is_true_event: image.is_true_event || false,
      is_ai_generated: image.is_ai_generated || false,
      is_mature_content: image.is_mature_content || false,
      source: image.source || '',
      gps: image.gps,
      latitude: latitude,
      longitude: longitude,
      accuracy_description: image.accuracy_description,
      accuracy_date: image.accuracy_date,
      accuracy_location: image.accuracy_location,
      accuracy_historical: image.accuracy_historical,
      accuracy_realness: image.accuracy_realness,
      accuracy_maturity: image.accuracy_maturity
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saved Images</h2>
        <Button 
          variant="outline" 
          onClick={fetchSavedImages}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
          <TabsTrigger value="ai">AI Generated</TabsTrigger>
          <TabsTrigger value="mature">Mature</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="animate-spin mr-2" />
              <p>Loading saved images...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <ImageIcon size={48} className="mb-4 opacity-20" />
              <p>No images found in this category</p>
              <Button 
                variant="link" 
                onClick={fetchSavedImages}
                className="mt-2"
              >
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <Card key={image.id} className="overflow-hidden h-full flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-muted cursor-pointer"
                       onClick={() => handleViewImage(image)}>
                    {image.image_url ? (
                      <img 
                        src={image.image_url} 
                        alt={image.title || "Saved image"} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon size={48} className="text-muted-foreground opacity-20" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-1">
                      {image.ready_for_game && (
                        <Badge variant="default" className="bg-green-500">Ready</Badge>
                      )}
                      {image.is_true_event && (
                        <Badge variant="secondary">Historical</Badge>
                      )}
                      {image.is_ai_generated && (
                        <Badge variant="outline">AI</Badge>
                      )}
                      {image.is_mature_content && (
                        <Badge variant="destructive">Mature</Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="flex-1 p-4">
                    <h3 className="font-medium truncate" title={image.title}>
                      {image.title || "Untitled"}
                    </h3>
                    
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{image.date || image.year || "Unknown date"}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span className="truncate" title={image.location || image.country}>
                          {image.location || image.country || "Unknown location"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Desc:</span>
                        <span>{formatAccuracy(image.accuracy_description)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{formatAccuracy(image.accuracy_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span>{formatAccuracy(image.accuracy_location)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Historical:</span>
                        <span>{formatAccuracy(image.accuracy_historical)}</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="p-4 pt-0 mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center justify-center"
                      onClick={() => handleViewImage(image)}
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <FullscreenImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        image={selectedImage ? formatImageForViewer(selectedImage) : null}
      />
    </div>
  );
};

export default SavedImagesGallery;
