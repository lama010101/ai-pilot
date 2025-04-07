import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageIcon, Wand2, Clipboard, Loader2, Save, RefreshCw, Upload, FileSpreadsheet, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageGenerationResponse, ImageGenerationRow } from "@/types/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';
import SavedPromptsList from './SavedPromptsList';
import useSavedPrompts from '@/hooks/useSavedPrompts';

interface ImageGeneratorUIProps {
  onImageGenerated?: (response: ImageGenerationResponse) => void;
  suppressHeader?: boolean;
}

const ImageGeneratorUI: React.FC<ImageGeneratorUIProps> = ({ 
  onImageGenerated,
  suppressHeader = false 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageGenerationResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [xlsxRows, setXlsxRows] = useState<ImageGenerationRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<{row: number, reason: string}[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<{
    success: number;
    failed: number;
    total: number;
  }>({ success: 0, failed: 0, total: 0 });
  
  const { savedPrompts, savePrompt, removePrompt, clearAllPrompts } = useSavedPrompts();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const headerAliasMap: Record<string, string[]> = {
    "title": ["title", "Title", "name", "Name", "event", "Event"],
    "description": ["description", "Description", "desc", "Desc", "details", "Details", "content", "Content"],
    "year": ["year", "Year", "yr", "Yr", "year_value", "año", "anno"],
    "gps.lat": ["lat", "latitude", "Latitude", "latitud", "Latitud", "gps.lat", "gps_lat", "lat_value"],
    "gps.lng": ["lng", "lon", "long", "longitude", "Longitude", "longitud", "Longitud", "gps.lng", "gps_lng", "lng_value", "lon_value"],
    "date": ["date", "Date", "full_date", "event_date", "fecha"],
    "address": ["address", "Address", "location", "Location", "place", "Place", "ciudad", "City", "city"],
    "mature": ["mature", "Mature", "adult", "Adult", "nsfw", "NSFW", "is_mature", "mature_content"],
    "true_event": ["true_event", "TrueEvent", "real", "Real", "historical", "Historical", "is_real", "is_historical", "is_true"]
  };

  const normalizeColumnName = (name: string): string => {
    const normalized = name.toLowerCase().trim().replace(/\s+/g, '_');
    
    for (const [standardName, aliases] of Object.entries(headerAliasMap)) {
      if (aliases.includes(normalized) || aliases.includes(name)) {
        return standardName;
      }
    }
    
    return normalized;
  };

  const generateImage = useCallback(async () => {
    if (!prompt && !isAutoMode) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt or enable auto-generation mode",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      setLogs([`${new Date().toLocaleTimeString()} - Starting image generation...`]);
      setActiveTab('logs');

      if (prompt.trim()) {
        savePrompt(prompt);
      }

      const response = await supabase.functions.invoke('image-generator', {
        body: {
          manualPrompt: prompt,
          autoMode: isAutoMode,
          source: 'dalle',
          mode: 'manual'
        }
      });

      if (response.error) {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ❌ Error: ${response.error.message || "Edge Function error"}`]);
        throw new Error(response.error.message || "Failed to generate image");
      }

      const data = response.data as ImageGenerationResponse;
      
      if (data.error) {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ❌ Error: ${data.error}`]);
        throw new Error(data.error);
      }
      
      setLogs(prev => [...prev, ...data.logs.map(log => {
        const parts = log.split(' - ');
        return parts.length > 1 ? parts[1] : log;
      })]);
      
      setGeneratedImage(data);
      setActiveTab('preview');
      
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ✅ Image generated successfully: ${data.imageUrl}`]);
      
      toast({
        title: "Image generated",
        description: "Successfully generated image from prompt",
      });
      
      if (onImageGenerated) {
        onImageGenerated(data);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ❌ ERROR: ${error.message}`]);
      
      toast({
        title: "Generation failed",
        description: error.message || "There was an error generating the image",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isAutoMode, toast, onImageGenerated, savePrompt]);

  const copyPrompt = useCallback(() => {
    if (generatedImage?.promptUsed) {
      navigator.clipboard.writeText(generatedImage.promptUsed);
      toast({
        title: "Prompt copied",
        description: "The prompt has been copied to your clipboard",
      });
    }
  }, [generatedImage, toast]);

  const refreshPrompt = useCallback(() => {
    setPrompt('');
    setGeneratedImage(null);
    setActiveTab('manual');
    setLogs([]);
    setXlsxFile(null);
    setXlsxRows([]);
    setInvalidRows([]);
    
    toast({
      title: "Reset",
      description: "Prompt and generated image have been cleared",
    });
  }, [toast]);

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateRow = (row: any, index: number): { valid: boolean; data?: ImageGenerationRow; reason?: string } => {
    const issues: string[] = [];

    const normalizedRow: Record<string, any> = {};
    
    for (const [originalKey, value] of Object.entries(row)) {
      const normalizedKey = normalizeColumnName(originalKey);
      normalizedRow[normalizedKey] = value;
    }
    
    let title = normalizedRow.title;
    let description = normalizedRow.description;
    let year = normalizedRow.year;
    let lat = null;
    let lng = null;
    let date = normalizedRow.date;
    let address = normalizedRow.address;
    let mature = normalizedRow.mature;
    let trueEvent = normalizedRow.true_event;
    
    if (normalizedRow['gps.lat'] !== undefined && normalizedRow['gps.lng'] !== undefined) {
      lat = Number(normalizedRow['gps.lat']);
      lng = Number(normalizedRow['gps.lng']);
    } else if (normalizedRow.gps && typeof normalizedRow.gps === 'object') {
      lat = Number(normalizedRow.gps.lat);
      lng = Number(normalizedRow.gps.lng);
    } else if (normalizedRow.lat !== undefined && normalizedRow.lng !== undefined) {
      lat = Number(normalizedRow.lat);
      lng = Number(normalizedRow.lng);
    } else if (normalizedRow.latitude !== undefined && normalizedRow.longitude !== undefined) {
      lat = Number(normalizedRow.latitude);
      lng = Number(normalizedRow.longitude);
    }
    
    if (!title) issues.push('Missing title');
    if (!description) issues.push('Missing description');
    
    if (year) {
      year = Number(year);
      if (isNaN(year) || !Number.isInteger(year)) {
        issues.push('Year must be a valid integer');
      }
    } else {
      issues.push('Missing year');
    }
    
    if (isNaN(lat) || isNaN(lng)) {
      issues.push('GPS coordinates must be valid numbers');
    }
    
    if (issues.length > 0) {
      return { valid: false, reason: issues.join(', ') };
    }
    
    const validRow: ImageGenerationRow = {
      title: String(title),
      description: String(description),
      year: Number(year),
      gps: { lat: Number(lat), lng: Number(lng) },
      date: date ? String(date) : undefined,
      address: address ? String(address) : undefined,
      mature: mature !== undefined ? Boolean(mature) : undefined,
      true_event: trueEvent !== undefined ? Boolean(trueEvent) : undefined
    };
    
    return { valid: true, data: validRow };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive"
      });
      return;
    }
    
    setXlsxFile(file);
    setLogs([`${new Date().toLocaleTimeString()} - Processing ${file.name}...`]);
    setActiveTab('logs');
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const validRows: ImageGenerationRow[] = [];
      const invalidRowsList: {row: number, reason: string}[] = [];
      
      jsonData.forEach((row: any, index: number) => {
        const result = validateRow(row, index);
        
        if (result.valid && result.data) {
          validRows.push(result.data);
        } else {
          invalidRowsList.push({
            row: index + 2,
            reason: result.reason || 'Unknown validation error'
          });
          
          setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Row ${index + 2} invalid: ${result.reason}`]);
        }
      });
      
      setXlsxRows(validRows);
      setInvalidRows(invalidRowsList);
      
      if (validRows.length === 0) {
        toast({
          title: "No valid rows found",
          description: "The Excel file doesn't contain any valid rows with required fields",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Excel file processed",
          description: `Found ${validRows.length} valid rows${invalidRowsList.length > 0 ? ` (${invalidRowsList.length} invalid)` : ''}`,
        });
        
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Excel processing complete. Found ${validRows.length} valid rows, ${invalidRowsList.length} invalid rows.`]);
      }
    } catch (error) {
      console.error("Error processing Excel file:", error);
      
      toast({
        title: "File processing error",
        description: error.message || "Failed to process the Excel file",
        variant: "destructive"
      });
      
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Error processing Excel file: ${error.message}`]);
    }
  };

  const generateBatchImages = async () => {
    if (xlsxRows.length === 0) {
      toast({
        title: "No data to process",
        description: "Please upload an Excel file with valid data first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsBatchGenerating(true);
      setActiveTab('logs');
      setBatchProgress(0);
      setBatchResults({ success: 0, failed: 0, total: xlsxRows.length });
      
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Starting batch image generation for ${xlsxRows.length} events...`]);
      
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < xlsxRows.length; i++) {
        const row = xlsxRows[i];
        const progressPercent = Math.round(((i) / xlsxRows.length) * 100);
        setBatchProgress(progressPercent);
        
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - [${i+1}/${xlsxRows.length}] Generating image for "${row.title}"...`]);
        
        try {
          const response = await supabase.functions.invoke('image-generator', {
            body: {
              manualPrompt: row.description,
              autoMode: false,
              source: 'dalle',
              metadata: {
                title: row.title,
                description: row.description,
                year: row.year,
                date: row.date,
                address: row.address,
                location: row.address,
                gps: row.gps ? {
                  lat: row.gps.lat,
                  lng: row.gps.lng || row.gps.lng
                } : null,
                is_true_event: row.true_event || false,
                is_ai_generated: true,
                ready_for_game: false,
                is_mature_content: row.mature || false
              }
            }
          });
          
          if (response.error || (response.data && response.data.error)) {
            const errorMessage = response.error?.message || 
                               (response.data && response.data.error) || 
                               "Unknown error occurred";
            throw new Error(errorMessage);
          }
          
          successCount++;
          setBatchResults(prev => ({ ...prev, success: successCount }));
          
          setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ✅ Success: Generated image for "${row.title}"`]);
        } catch (error) {
          console.error(`Error generating image for row ${i}:`, error);
          failCount++;
          setBatchResults(prev => ({ ...prev, failed: failCount }));
          
          setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ❌ Error: Failed to generate image for "${row.title}" - ${error.message}`]);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setBatchProgress(100);
      
      const summary = `${successCount}/${xlsxRows.length} images generated successfully${failCount > 0 ? `, ${failCount} failed` : ''}`;
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Batch generation complete. ${summary}`]);
      
      toast({
        title: "Batch generation complete",
        description: summary,
      });
    } catch (error) {
      console.error("Batch generation error:", error);
      
      toast({
        title: "Batch generation failed",
        description: error.message || "There was an error during batch generation",
        variant: "destructive"
      });
      
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ERROR: Batch generation failed - ${error.message}`]);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      {!suppressHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            <span>AI Image Generator</span>
          </CardTitle>
          <CardDescription>
            Generate AI images for historical events using DALL-E
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="writer">Writer</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedImage}>Preview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="writer" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="writer-instructions">Instructions for Writer Agent</Label>
                <Textarea
                  id="writer-instructions"
                  placeholder="Describe what kind of historical events you want (e.g., 'Generate 5 medieval battles in cinematic style, 9:16 ratio')"
                  className="min-h-[120px] resize-y"
                />
                <p className="text-sm text-muted-foreground">
                  Writer will generate structured prompts with full metadata ready for image generation
                </p>
              </div>
              
              <Button
                className="w-full"
                disabled={true}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Prompts from Instructions (Coming Soon)
              </Button>
              
              <div className="bg-muted/50 p-6 rounded-md text-center">
                <p className="mb-2 text-sm font-medium">Writer Agent Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  In the next update, you'll be able to generate structured historical event prompts with all required metadata automatically
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-mode"
                  checked={isAutoMode}
                  onCheckedChange={setIsAutoMode}
                />
                <Label htmlFor="auto-mode">Auto-generate prompt (Writer Agent)</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prompt">Event Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe a historical event (e.g., 'The moon landing in 1969')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isAutoMode || isGenerating}
                  className="min-h-[120px] resize-y"
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about the event, date, and location for best results
                </p>
              </div>
              
              <SavedPromptsList 
                prompts={savedPrompts}
                onSelectPrompt={(text) => setPrompt(text)}
                onRemovePrompt={removePrompt}
                onClearAll={clearAllPrompts}
              />
              
              <div className="space-y-4">
                <Button
                  onClick={generateImage}
                  disabled={isGenerating || (!prompt && !isAutoMode)}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="border border-dashed p-6 rounded-md text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={triggerFileSelect}
                          className="flex items-center justify-center mb-2"
                        >
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Upload Excel File (.xlsx)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload spreadsheet of events with title, description, year, and GPS</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an Excel file containing events to generate images for
                  </p>
                  
                  {xlsxFile && (
                    <Badge variant="outline" className="px-3 py-1">
                      {xlsxFile.name}
                    </Badge>
                  )}
                </div>
                
                {xlsxRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Excel Data Preview</h3>
                      <Badge variant={invalidRows.length > 0 ? "destructive" : "outline"}>
                        {invalidRows.length > 0 ? `${invalidRows.length} Invalid Rows` : 'All Rows Valid'}
                      </Badge>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>GPS</TableHead>
                            <TableHead>Other</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {xlsxRows.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.title}</TableCell>
                              <TableCell className="max-w-[300px] truncate">{row.description}</TableCell>
                              <TableCell>{row.year}</TableCell>
                              <TableCell>{row.gps?.lat}, {row.gps?.lng}</TableCell>
                              <TableCell>
                                {row.date && <Badge variant="outline" className="mr-1">Date: {row.date}</Badge>}
                                {row.address && <Badge variant="outline" className="mr-1">Location</Badge>}
                                {row.mature && <Badge variant="destructive" className="mr-1">Mature</Badge>}
                                {row.true_event && <Badge variant="secondary" className="mr-1">True Event</Badge>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {batchResults.total > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm">Batch Progress:</p>
                          <p className="text-sm">{batchResults.success + batchResults.failed}/{batchResults.total}</p>
                        </div>
                        <Progress value={batchProgress} />
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">✅ {batchResults.success} succeeded</span>
                          {batchResults.failed > 0 && (
                            <span className="text-red-600">❌ {batchResults.failed} failed</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={generateBatchImages}
                            disabled={isBatchGenerating || xlsxRows.length === 0}
                            className="flex-1 w-full"
                          >
                            {isBatchGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Batch...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate All Images ({xlsxRows.length})
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create images only for selected events</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            {generatedImage ? (
              <>
                <div className="aspect-square overflow-hidden rounded-md bg-muted flex items-center justify-center">
                  {generatedImage.imageUrl ? (
                    <img
                      src={generatedImage.imageUrl}
                      alt={generatedImage.metadata.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Prompt Used</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyPrompt}
                        className="h-8 w-8 p-0"
                      >
                        <Clipboard className="h-4 w-4" />
                        <span className="sr-only">Copy prompt</span>
                      </Button>
                    </div>
                    <p className="mt-1 text-sm">{generatedImage.promptUsed}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <p className="mt-1 text-sm">{generatedImage.metadata.title}</p>
                    </div>
                    
                    <div>
                      <Label>Year/Date</Label>
                      <p className="mt-1 text-sm">
                        {generatedImage.metadata.date || generatedImage.metadata.year || 'Unknown'}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Location</Label>
                      <p className="mt-1 text-sm">
                        {generatedImage.metadata.address || 'Unknown'}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Source</Label>
                      <p className="mt-1 text-sm capitalize">
                        {generatedImage.metadata.source || "dalle"}
                      </p>
                    </div>
                    
                    {generatedImage.metadata.gps && (
                      <div className="col-span-2">
                        <Label>GPS Coordinates</Label>
                        <p className="mt-1 text-sm font-mono">
                          {generatedImage.metadata.gps.lat}, {generatedImage.metadata.gps.lon || generatedImage.metadata.gps.lng}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium">No image generated yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate an image to see the preview
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="space-y-2">
              <Label>Generation Logs</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {logs.length > 0 ? (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log, index) => (
                      <div key={index} className={`py-0.5 ${log.includes('ERROR') || log.includes('❌') ? 'text-red-500' : log.includes('Success') || log.includes('✅') ? 'text-green-500' : ''}`}>
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No logs available
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImageGeneratorUI;
