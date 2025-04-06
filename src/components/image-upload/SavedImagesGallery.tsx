
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Eye,
  Calendar,
  MapPin,
  Tag,
  CheckCircle,
  XCircle,
  ImageIcon,
  RefreshCw,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

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
  accuracy_description: number | null;
  accuracy_date: number | null;
  accuracy_location: number | null;
  accuracy_historical: number | null;
  accuracy_realness: number | null;
  accuracy_maturity: number | null;
  manual_override: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const SavedImagesGallery = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedImages();
  }, []);

  const fetchSavedImages = async () => {
    setIsLoading(true);
    try {
      // Fetch images from the Supabase 'images' table
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Convert the data to match the SavedImage interface
      const typedImages: SavedImage[] = data?.map(item => ({
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
        // Add fields that might not be in the database yet but are in our interface
        is_mature_content: item.is_mature_content ?? false,
        accuracy_description: item.accuracy_description ?? null,
        accuracy_date: item.accuracy_date ?? null,
        accuracy_location: item.accuracy_location ?? null,
        accuracy_historical: item.accuracy_historical ?? null,
        accuracy_realness: item.accuracy_realness ?? null,
        accuracy_maturity: item.accuracy_maturity ?? null,
        manual_override: item.manual_override ?? false,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];
      
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

  // Function to safely display GPS coordinates
  const displayGpsCoordinates = (gps: Json | null): string => {
    if (!gps) return "N/A";
    
    try {
      // Handle GPS being an object with lat/lon properties
      if (typeof gps === 'object' && gps !== null) {
        const gpsObj = gps as Record<string, any>;
        if (gpsObj.lat !== undefined && gpsObj.lon !== undefined) {
          return `${gpsObj.lat}, ${gpsObj.lon}`;
        }
        // Handle GPS being an array [lat, lng]
        if (Array.isArray(gps) && gps.length >= 2) {
          return `${gps[0]}, ${gps[1]}`;
        }
      }
      // If we can't determine the format, just stringify it
      return JSON.stringify(gps);
    } catch (e) {
      console.error("Error parsing GPS data:", e);
      return "Invalid GPS data";
    }
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
                  <div className="relative aspect-video overflow-hidden bg-muted">
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
                        <span className="truncate" title={image.location}>
                          {image.location || "Unknown location"}
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
      
      {/* Image Details Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        {selectedImage && (
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedImage.title || "Image Details"}</DialogTitle>
              <DialogDescription>
                Saved on {new Date(selectedImage.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                  {selectedImage.image_url ? (
                    <img 
                      src={selectedImage.image_url} 
                      alt={selectedImage.title || "Saved image"} 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon size={64} className="text-muted-foreground opacity-20" />
                    </div>
                  )}
                </div>
                
                {selectedImage.description_image_url && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={selectedImage.description_image_url} 
                      alt="Description"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Metadata</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Title</p>
                      <p>{selectedImage.title || "N/A"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="whitespace-pre-line">{selectedImage.description || "N/A"}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                        <p>{selectedImage.date || "N/A"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Year</p>
                        <p>{selectedImage.year || "N/A"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p>{selectedImage.location || "N/A"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">GPS</p>
                        <p>{displayGpsCoordinates(selectedImage.gps)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Properties</h3>
                  
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="flex items-center">
                      <span className="mr-2">Historical Event:</span>
                      {selectedImage.is_true_event ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="mr-2">AI Generated:</span>
                      {selectedImage.is_ai_generated ? (
                        <CheckCircle size={16} className="text-amber-500" />
                      ) : (
                        <XCircle size={16} className="text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="mr-2">Mature Content:</span>
                      {selectedImage.is_mature_content ? (
                        <CheckCircle size={16} className="text-red-500" />
                      ) : (
                        <XCircle size={16} className="text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="mr-2">Ready for Game:</span>
                      {selectedImage.ready_for_game ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="mr-2">Manual Override:</span>
                      {selectedImage.manual_override ? (
                        <CheckCircle size={16} className="text-amber-500" />
                      ) : (
                        <XCircle size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Accuracy Scores</h3>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex justify-between items-center">
                      <span>Description:</span>
                      <Badge variant="outline">
                        {formatAccuracy(selectedImage.accuracy_description)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Date:</span>
                      <Badge variant="outline">
                        {formatAccuracy(selectedImage.accuracy_date)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Location:</span>
                      <Badge variant="outline">
                        {formatAccuracy(selectedImage.accuracy_location)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Historical:</span>
                      <Badge variant="outline">
                        {formatAccuracy(selectedImage.accuracy_historical)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Realness:</span>
                      <Badge variant="outline">
                        {formatAccuracy(selectedImage.accuracy_realness)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Maturity:</span>
                      <Badge variant="outline">
                        {formatAccuracy(selectedImage.accuracy_maturity)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default SavedImagesGallery;
