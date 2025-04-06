
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import JSZip from "https://esm.sh/jszip@3.10.1";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ImageMetadata {
  title: string | null;
  description: string | null;
  date: string | null;
  year: number | null;
  location: string | null;
  gps: { lat: number; lon: number } | null;
  is_true_event: boolean;
  is_ai_generated: boolean;
}

// Helper function to extract text from an image
async function extractTextFromImage(imageData: ArrayBuffer): Promise<string> {
  // This is a simplified placeholder - in a production app, you'd use 
  // a proper OCR service like Google Vision API or Tesseract.js
  // For now, we'll just simulate OCR by returning a placeholder text
  
  console.log("Extracting text from image...");
  // Return placeholder text for now
  return "Sample Title\nLocation: New York\nDate: 2023-05-15\nThis is a description of an event\nAI Generated: No";
}

// Helper function to parse metadata from extracted text
function parseMetadata(text: string): ImageMetadata {
  console.log("Parsing metadata from text:", text);
  
  // Very simplistic parsing logic - in a real app, you'd use more robust NLP
  const lines = text.split('\n');
  let title = null;
  let location = null;
  let date = null;
  let description = null;
  let isAIGenerated = false;
  
  if (lines.length > 0) title = lines[0].includes(":") ? lines[0].split(":")[1].trim() : lines[0].trim();
  
  for (const line of lines) {
    if (line.toLowerCase().startsWith("location:")) {
      location = line.substring("location:".length).trim();
    } else if (line.toLowerCase().startsWith("date:")) {
      date = line.substring("date:".length).trim();
    } else if (line.toLowerCase().includes("ai generated:") || line.toLowerCase().includes("ai-generated:")) {
      isAIGenerated = line.toLowerCase().includes("yes") || line.toLowerCase().includes("true");
    } else if (!title && !line.includes(":")) {
      description = line.trim();
    }
  }
  
  return {
    title,
    description,
    date,
    year: date ? new Date(date).getFullYear() : null,
    location,
    gps: null, // We'd use a geocoding API in a real implementation
    is_true_event: !isAIGenerated,
    is_ai_generated: isAIGenerated
  };
}

// Process a pair of images (event image + description image)
async function processImagePair(
  eventImageName: string, 
  eventImageData: ArrayBuffer,
  descImageName: string, 
  descImageData: ArrayBuffer
): Promise<{metadata: ImageMetadata, eventImagePath: string, descImagePath: string}> {
  console.log(`Processing image pair: ${eventImageName} & ${descImageName}`);
  
  // Extract text from description image
  const extractedText = await extractTextFromImage(descImageData);
  const metadata = parseMetadata(extractedText);
  
  // Store images in Supabase Storage
  const eventImagePath = `event/${eventImageName}`;
  const descImagePath = `desc/${descImageName}`;
  
  // Upload event image
  const { error: eventUploadError } = await supabase.storage
    .from('event_images')
    .upload(eventImagePath, new Uint8Array(eventImageData), {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (eventUploadError) {
    console.error("Error uploading event image:", eventUploadError.message);
    throw new Error(`Failed to upload event image: ${eventUploadError.message}`);
  }
  
  // Upload description image
  const { error: descUploadError } = await supabase.storage
    .from('event_images')
    .upload(descImagePath, new Uint8Array(descImageData), {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (descUploadError) {
    console.error("Error uploading description image:", descUploadError.message);
    throw new Error(`Failed to upload description image: ${descUploadError.message}`);
  }
  
  return {
    metadata,
    eventImagePath,
    descImagePath
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const formData = await req.formData();
    const eventZipFile = formData.get('eventZip') as File;
    const descZipFile = formData.get('descriptionZip') as File;
    
    if (!eventZipFile || !descZipFile) {
      return new Response(JSON.stringify({
        error: 'Both event and description ZIP files are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Load the ZIP files
    const eventZip = new JSZip();
    const descZip = new JSZip();
    
    await eventZip.loadAsync(await eventZipFile.arrayBuffer());
    await descZip.loadAsync(await descZipFile.arrayBuffer());
    
    // Extract file lists
    const eventFiles = Object.keys(eventZip.files)
      .filter(name => !eventZip.files[name].dir && name.match(/\.(jpg|jpeg|png)$/i));
    
    const descFiles = Object.keys(descZip.files)
      .filter(name => !descZip.files[name].dir && name.match(/\.(jpg|jpeg|png)$/i));
    
    console.log(`Found ${eventFiles.length} event images and ${descFiles.length} description images`);
    
    // Process up to 10 images for demo purposes
    // In a real app, you'd process all images and match them intelligently
    const processedImages = [];
    const limit = Math.min(10, Math.min(eventFiles.length, descFiles.length));
    
    for (let i = 0; i < limit; i++) {
      const eventFileName = eventFiles[i];
      const descFileName = descFiles[i];
      
      // Get file data
      const eventFileData = await eventZip.files[eventFileName].async('arraybuffer');
      const descFileData = await descZip.files[descFileName].async('arraybuffer');
      
      // Process the pair
      const result = await processImagePair(
        eventFileName, 
        eventFileData,
        descFileName, 
        descFileData
      );
      
      // Get public URLs for the images
      const eventImageUrl = `${supabaseUrl}/storage/v1/object/public/event_images/${result.eventImagePath}`;
      const descImageUrl = `${supabaseUrl}/storage/v1/object/public/event_images/${result.descImagePath}`;
      
      // Prepare result object with image URLs
      processedImages.push({
        originalFileName: eventFileName,
        descFileName: descFileName,
        metadata: result.metadata,
        imageUrl: eventImageUrl,
        descriptionImageUrl: descImageUrl
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      processedImages
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error processing images:", error);
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred while processing the images'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
