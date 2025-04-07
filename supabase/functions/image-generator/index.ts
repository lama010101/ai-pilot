
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Access OpenAI API key
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

// Simple metadata extraction from prompt (fallback method)
function extractMetadataFromPrompt(prompt: string): Record<string, any> {
  console.log("Extracting metadata from prompt:", prompt);
  
  let year = null;
  let date = null;
  let location = null;
  let title = null;
  
  // Try to extract year - matches 4 digits that could be a year
  const yearMatch = prompt.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
  }
  
  // Extract potential location keywords
  const locationMatches = prompt.match(/\b(in|at|near|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (locationMatches && locationMatches.length >= 3) {
    location = locationMatches[2];
  }
  
  // Simple title extraction
  const lines = prompt.split(/[\.\?\!]/);
  if (lines.length > 0) {
    title = lines[0].trim();
    if (title.length > 100) {
      title = title.substring(0, 100) + '...';
    }
  }
  
  // Create a basic date if we have a year
  if (year) {
    date = `${year}`;
  }
  
  return {
    title: title || "AI Generated Image",
    description: prompt,
    year,
    date,
    location,
    gps: null, // Will be filled by geocoding if location is found
    is_true_event: false,
    is_ai_generated: true,
    ready_for_game: false,
    is_mature_content: false,
    source: "dalle"
  };
}

// Helper function to geocode a location string
async function geocodeLocation(locationString: string): Promise<{lat: number, lon: number} | null> {
  if (!locationString) return null;
  
  try {
    // Use OpenStreetMap Nominatim API for geocoding (free and doesn't require API key)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationString)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'AI-Pilot-ImageGenerator/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error("Geocoding error:", response.statusText);
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Generate an image using DALL-E 3
async function generateImage(prompt: string, source = 'dalle'): Promise<{url: string, status: string}> {
  console.log(`Generating image with ${source} using prompt: ${prompt}`);
  
  // For now, we only support DALL-E 3
  if (source !== 'dalle') {
    throw new Error(`Unsupported image generation source: ${source}`);
  }
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not configured");
  }
  
  // Enhance the prompt for better historical imagery
  const enhancedPrompt = `Historical photograph or painting of ${prompt}. Highly detailed, realistic style.`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return {
      url: data.data[0].url,
      status: "success"
    };
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}

// Helper to upload image from URL to Supabase Storage
async function uploadImageToStorage(imageUrl: string, filename: string): Promise<string> {
  console.log(`Uploading image from ${imageUrl} to storage as ${filename}`);
  
  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = new Uint8Array(imageArrayBuffer);
    
    // Check if events bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets.some(bucket => bucket.name === 'events')) {
      await supabase.storage.createBucket('events', {
        public: true
      });
      console.log("Created 'events' storage bucket");
    }
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('events')
      .upload(`generated/${filename}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(`generated/${filename}`);
    
    return publicUrl;
  } catch (error) {
    console.error("Storage upload error:", error);
    throw error;
  }
}

// Save image metadata to database
async function saveImageMetadata(metadata: Record<string, any>, imageUrl: string): Promise<string> {
  console.log("Saving image metadata to database:", metadata);
  
  try {
    const { data, error } = await supabase
      .from('images')
      .insert({
        title: metadata.title,
        description: metadata.description,
        date: metadata.date,
        year: metadata.year,
        location: metadata.address || metadata.location,
        gps: metadata.gps,
        is_true_event: metadata.is_true_event || false,
        is_ai_generated: metadata.is_ai_generated || true,
        ready_for_game: metadata.ready_for_game || false,
        is_mature_content: metadata.is_mature_content || false,
        image_url: imageUrl,
        description_image_url: imageUrl,
        source: metadata.source || "dalle"
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data.id;
  } catch (error) {
    console.error("Metadata save error:", error);
    throw error;
  }
}

// Main handler function
serve(async (req) => {
  console.log(`Received ${req.method} request to image-generator`);
  const logs: string[] = [`${new Date().toISOString()} - Request received`];
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured in the edge function");
    }
    
    const { manualPrompt, autoMode, source = 'dalle', metadata = null } = await req.json();
    logs.push(`${new Date().toISOString()} - Request params: manualPrompt=${!!manualPrompt}, autoMode=${autoMode}, source=${source}`);
    
    let finalPrompt = '';
    let providedMetadata = metadata;
    
    // Handle auto-generation mode
    if (autoMode) {
      logs.push(`${new Date().toISOString()} - Auto mode activated, requesting prompt from Writer agent`);
      // TODO: Implement Writer agent integration
      // For now, use a placeholder historical event if no manual prompt is provided
      finalPrompt = manualPrompt || "The moon landing in 1969";
      logs.push(`${new Date().toISOString()} - Writer agent not implemented, using fallback: "${finalPrompt}"`);
    } else {
      // Use manual prompt
      if (!manualPrompt) {
        throw new Error("Manual prompt is required when autoMode is false");
      }
      finalPrompt = manualPrompt;
      logs.push(`${new Date().toISOString()} - Using manual prompt: "${finalPrompt}"`);
    }
    
    // Extract metadata from prompt or use provided metadata
    let extractedMetadata = providedMetadata || extractMetadataFromPrompt(finalPrompt);
    logs.push(`${new Date().toISOString()} - ${providedMetadata ? 'Using provided metadata' : 'Extracted metadata from prompt'}`);
    
    // Geocode location if available
    if (extractedMetadata.location && !extractedMetadata.gps) {
      logs.push(`${new Date().toISOString()} - Geocoding location: ${extractedMetadata.location}`);
      const gpsCoordinates = await geocodeLocation(extractedMetadata.location);
      if (gpsCoordinates) {
        extractedMetadata.gps = gpsCoordinates;
        logs.push(`${new Date().toISOString()} - Geocoded successfully: ${JSON.stringify(gpsCoordinates)}`);
      } else {
        logs.push(`${new Date().toISOString()} - Geocoding failed for location: ${extractedMetadata.location}`);
      }
    }
    
    // Generate image
    logs.push(`${new Date().toISOString()} - Generating image with ${source}`);
    const { url: generatedImageUrl } = await generateImage(finalPrompt, source);
    logs.push(`${new Date().toISOString()} - Image generated successfully`);
    
    // Upload to Supabase storage
    const timestamp = Date.now();
    const filename = `image_${timestamp}.png`;
    logs.push(`${new Date().toISOString()} - Uploading image to storage as ${filename}`);
    const storedImageUrl = await uploadImageToStorage(generatedImageUrl, filename);
    logs.push(`${new Date().toISOString()} - Image uploaded to storage: ${storedImageUrl}`);
    
    // Save metadata to database
    logs.push(`${new Date().toISOString()} - Saving metadata to database`);
    const imageId = await saveImageMetadata(extractedMetadata, storedImageUrl);
    logs.push(`${new Date().toISOString()} - Metadata saved with ID: ${imageId}`);
    
    // Format response according to spec
    const response = {
      imageUrl: storedImageUrl,
      promptUsed: finalPrompt,
      metadata: {
        title: extractedMetadata.title,
        description: extractedMetadata.description,
        year: extractedMetadata.year,
        date: extractedMetadata.date,
        address: extractedMetadata.address || extractedMetadata.location,
        gps: extractedMetadata.gps ? {
          lat: extractedMetadata.gps.lat,
          lng: extractedMetadata.gps.lon // Map from lon to lng format
        } : null,
        ai_generated: true,
        true_event: extractedMetadata.is_true_event || false,
        ready: extractedMetadata.ready_for_game || false,
        mature: extractedMetadata.is_mature_content || false,
        source: source
      },
      status: "success",
      logs
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error("Error in image-generator function:", error);
    logs.push(`${new Date().toISOString()} - ERROR: ${error.message}`);
    
    return new Response(JSON.stringify({
      error: error.message,
      status: "error",
      logs
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
