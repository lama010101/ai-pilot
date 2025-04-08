
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
  let country = null;
  
  // Try to extract year - matches 4 digits that could be a year
  const yearMatch = prompt.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
    // Create a basic date if we have a year
    date = `${year}`;
  }
  
  // Extract potential location keywords
  const locationMatches = prompt.match(/\b(in|at|near|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (locationMatches && locationMatches.length >= 3) {
    location = locationMatches[2];
  }
  
  // Try to extract country
  const countryMatches = prompt.match(/\b(USA|United States|Canada|Mexico|Germany|France|UK|United Kingdom|Australia|Japan|China|Russia|Brazil|India|Italy|Spain|Netherlands)\b/i);
  if (countryMatches) {
    country = countryMatches[0];
  }
  
  // Simple title extraction
  const lines = prompt.split(/[\.\?\!]/);
  if (lines.length > 0) {
    title = lines[0].trim();
    if (title.length > 100) {
      title = title.substring(0, 100) + '...';
    }
  }
  
  return {
    title: title || "AI Generated Image",
    description: prompt,
    year,
    date,
    location,
    country,
    gps: null, // Will be filled by geocoding if location is found
    is_true_event: false,
    is_ai_generated: true,
    ready_for_game: false,
    is_mature_content: false,
    source: "dalle",
    accuracy_description: 1.0,
    accuracy_date: year ? 0.8 : 0.5,
    accuracy_location: location ? 0.7 : 0.5,
    accuracy_historical: 0.9,
    accuracy_realness: 0.9,
    accuracy_maturity: 1.0,
    manual_override: false
  };
}

// Helper function to geocode a location string
async function geocodeLocation(locationString: string): Promise<{lat: number, lng: number} | null> {
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
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Generate an image using DALL-E 3 exclusively
async function generateImage(prompt: string): Promise<{url: string, status: string}> {
  console.log(`Generating image using DALL-E 3 with prompt: ${prompt}`);
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not configured");
  }
  
  // Enhance the prompt for better historical imagery
  const enhancedPrompt = `Historical photograph or painting of ${prompt}. Highly detailed, photorealistic style.`;
  
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
        quality: "hd",
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

// Create optimized versions of the image
async function createOptimizedImages(imageBuffer: Uint8Array, filename: string): Promise<{
  original: string,
  mobile: string,
  tablet: string,
  desktop: string
}> {
  try {
    // Upload original image
    const { data: originalData, error: originalError } = await supabase.storage
      .from('events')
      .upload(`generated/original/${filename}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (originalError) throw originalError;
    
    // Get original public URL
    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(`generated/original/${filename}`);
    
    // For now, we'll use the same image for all sizes - in a production app,
    // you would actually resize the images here using an image processing library
    
    // Mobile version (simulated)
    const { data: mobileData, error: mobileError } = await supabase.storage
      .from('events')
      .upload(`generated/mobile/${filename}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (mobileError) throw mobileError;
    
    // Tablet version (simulated)
    const { data: tabletData, error: tabletError } = await supabase.storage
      .from('events')
      .upload(`generated/tablet/${filename}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (tabletError) throw tabletError;
    
    // Desktop version (simulated)
    const { data: desktopData, error: desktopError } = await supabase.storage
      .from('events')
      .upload(`generated/desktop/${filename}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (desktopError) throw desktopError;
    
    // Get public URLs for all versions
    const { data: { publicUrl: mobileUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(`generated/mobile/${filename}`);
    
    const { data: { publicUrl: tabletUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(`generated/tablet/${filename}`);
    
    const { data: { publicUrl: desktopUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(`generated/desktop/${filename}`);
    
    return {
      original: originalUrl,
      mobile: mobileUrl,
      tablet: tabletUrl,
      desktop: desktopUrl
    };
  } catch (error) {
    console.error("Error creating optimized images:", error);
    throw error;
  }
}

// Helper to upload image from URL to Supabase Storage
async function uploadImageToStorage(imageUrl: string, filename: string): Promise<{
  originalUrl: string,
  mobileUrl: string,
  tabletUrl: string,
  desktopUrl: string
}> {
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
    
    // Create and upload optimized versions
    const urls = await createOptimizedImages(imageBuffer, filename);
    
    return {
      originalUrl: urls.original,
      mobileUrl: urls.mobile,
      tabletUrl: urls.tablet,
      desktopUrl: urls.desktop
    };
  } catch (error) {
    console.error("Storage upload error:", error);
    throw error;
  }
}

// Save image metadata to database
async function saveImageMetadata(metadata: Record<string, any>, imageUrls: {
  originalUrl: string,
  mobileUrl: string,
  tabletUrl: string,
  desktopUrl: string
}): Promise<string> {
  console.log("Saving image metadata to database:", metadata);
  
  try {
    const dataToInsert: Record<string, any> = {
      title: metadata.title,
      description: metadata.description || metadata.detailed_description,
      date: metadata.date,
      year: metadata.year,
      location: metadata.address || metadata.location,
      country: metadata.country,
      gps: metadata.gps,
      is_true_event: metadata.is_true_event || false,
      is_ai_generated: metadata.is_ai_generated || true,
      ready_for_game: metadata.ready_for_game || metadata.ready || false,
      is_mature_content: metadata.is_mature_content || metadata.mature || false,
      image_url: imageUrls.originalUrl,
      image_mobile_url: imageUrls.mobileUrl,
      image_tablet_url: imageUrls.tabletUrl,
      image_desktop_url: imageUrls.desktopUrl,
      description_image_url: imageUrls.originalUrl,
      source: metadata.source || "dalle",
      accuracy_description: metadata.accuracy_description || 1.0,
      accuracy_date: metadata.accuracy_date || 0.7,
      accuracy_location: metadata.accuracy_location || 0.7,
      accuracy_historical: metadata.accuracy_historical || 0.9,
      accuracy_realness: metadata.accuracy_realness || 0.9,
      accuracy_maturity: metadata.accuracy_maturity || 1.0,
      manual_override: metadata.manual_override || false
    };
    
    // Handle additional writer-specific fields
    if (metadata.short_description) {
      dataToInsert.short_description = metadata.short_description;
    }
    
    if (metadata.detailed_description) {
      dataToInsert.detailed_description = metadata.detailed_description;
    }
    
    if (metadata.hints) {
      dataToInsert.hints = metadata.hints;
    }
    
    if (metadata.latitude && metadata.longitude) {
      dataToInsert.latitude = metadata.latitude;
      dataToInsert.longitude = metadata.longitude;
    } else if (metadata.gps) {
      dataToInsert.latitude = metadata.gps.lat;
      dataToInsert.longitude = metadata.gps.lng;
    }
    
    if (metadata.address) {
      dataToInsert.address = metadata.address;
    }
    
    const { data, error } = await supabase
      .from('images')
      .insert(dataToInsert)
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
    
    const parsedBody = await req.json().catch((err) => {
      logs.push(`${new Date().toISOString()} - ERROR: Invalid request body format - ${err.message}`);
      throw new Error("Invalid request body format. Expected JSON.");
    });
    
    const { manualPrompt, autoMode, metadata = null } = parsedBody;
    logs.push(`${new Date().toISOString()} - Request params: manualPrompt=${!!manualPrompt}, autoMode=${autoMode}, metadata=${!!metadata}`);
    
    // Validate request
    if (!manualPrompt && !autoMode) {
      logs.push(`${new Date().toISOString()} - ERROR: Missing required parameters. Either manualPrompt or autoMode must be true.`);
      throw new Error("Missing required parameters. Either manualPrompt or autoMode must be true.");
    }
    
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
        logs.push(`${new Date().toISOString()} - ERROR: Manual prompt is required when autoMode is false`);
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
    
    // Generate image using DALL-E 3 exclusively
    logs.push(`${new Date().toISOString()} - Generating image with DALL-E 3`);
    let generatedImageUrl;
    try {
      const { url } = await generateImage(finalPrompt);
      generatedImageUrl = url;
      logs.push(`${new Date().toISOString()} - ✅ Image generated successfully`);
    } catch (genError) {
      logs.push(`${new Date().toISOString()} - ❌ Image generation failed: ${genError.message}`);
      return new Response(JSON.stringify({
        error: genError.message,
        status: "error",
        logs
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    
    // Upload to Supabase storage
    const timestamp = Date.now();
    const filename = `image_${timestamp}.png`;
    logs.push(`${new Date().toISOString()} - Uploading image to storage as ${filename}`);
    let imageUrls;
    try {
      imageUrls = await uploadImageToStorage(generatedImageUrl, filename);
      logs.push(`${new Date().toISOString()} - ✅ Image uploaded to storage with responsive versions`);
    } catch (uploadError) {
      logs.push(`${new Date().toISOString()} - ❌ Image upload failed: ${uploadError.message}`);
      return new Response(JSON.stringify({
        error: uploadError.message,
        status: "error",
        imageUrl: generatedImageUrl, // Still return the original URL even if storage failed
        logs
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    
    // Save metadata to database
    logs.push(`${new Date().toISOString()} - Saving metadata to database`);
    let imageId;
    try {
      imageId = await saveImageMetadata(extractedMetadata, imageUrls);
      logs.push(`${new Date().toISOString()} - ✅ Metadata saved with ID: ${imageId}`);
    } catch (metadataError) {
      logs.push(`${new Date().toISOString()} - ❌ Metadata save failed: ${metadataError.message}`);
      // Continue even if metadata save fails - we still have the image
    }
    
    // Format response according to spec
    const response = {
      imageUrl: imageUrls.originalUrl,
      mobiledUrl: imageUrls.mobileUrl,
      tabletUrl: imageUrls.tabletUrl,
      desktopUrl: imageUrls.desktopUrl,
      promptUsed: finalPrompt,
      metadata: {
        title: extractedMetadata.title,
        description: extractedMetadata.description || extractedMetadata.detailed_description,
        year: extractedMetadata.year,
        date: extractedMetadata.date,
        address: extractedMetadata.address || extractedMetadata.location,
        country: extractedMetadata.country,
        gps: extractedMetadata.gps ? {
          lat: extractedMetadata.gps.lat,
          lng: extractedMetadata.gps.lng
        } : null,
        latitude: extractedMetadata.gps ? extractedMetadata.gps.lat : null,
        longitude: extractedMetadata.gps ? extractedMetadata.gps.lng : null,
        ai_generated: true,
        true_event: extractedMetadata.is_true_event || false,
        ready: extractedMetadata.ready_for_game || extractedMetadata.ready || false,
        mature: extractedMetadata.is_mature_content || extractedMetadata.mature || false,
        source: extractedMetadata.source || "dalle",
        accuracy_scores: {
          description: extractedMetadata.accuracy_description || 1.0,
          date: extractedMetadata.accuracy_date || 0.7,
          location: extractedMetadata.accuracy_location || 0.7,
          historical: extractedMetadata.accuracy_historical || 0.9,
          realness: extractedMetadata.accuracy_realness || 0.9,
          maturity: extractedMetadata.accuracy_maturity || 1.0
        }
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
