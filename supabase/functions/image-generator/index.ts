
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { decode } from 'https://deno.land/std@0.170.0/encoding/base64.ts';

// Constants for API endpoints and configuration
const LUMA_API_URL = "https://lumalabs.ai/api/generate";
const LUMA_API_KEY = "luma-dbe157ea-3c60-4bde-bf17-60692e0aabc3-54239a80-9bf7-4da1-a260-2a3b75de4294";

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize logs array to track the execution flow
  const logs: string[] = [];
  const logEntry = (message: string) => {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} - ${message}`;
    logs.push(entry);
    console.log(entry);
  };

  try {
    logEntry('Starting image generation process with Luma Labs');
    
    // Parse the request body
    const requestData = await req.json();
    const { prompt } = requestData;
    
    // Use a default test prompt if none provided
    const userPrompt = prompt || "A photorealistic crowd scene in the 1950s";
    
    logEntry(`Request received with prompt: ${userPrompt.substring(0, 100)}...`);
    
    // Enhance the prompt for better results
    const enhancedPrompt = `A photorealistic high-resolution image, taken by a professional war/photojournalist, using a vintage analog camera appropriate to the era. Grainy film, accurate shadows, era-specific lighting. Depict: ${userPrompt} -- Realistic style, historically accurate, correct clothing and architecture, natural facial expressions, no digital artifacts, consistent perspective, documentary framing.`;
    logEntry(`Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);
    
    // Call Luma Labs API
    logEntry(`Calling Luma Labs API at: ${LUMA_API_URL}`);
    
    // Prepare the payload for Luma Labs
    const lumaPayload = {
      prompt: enhancedPrompt,
      // Add other Luma-specific parameters as needed
      // Using defaults for other parameters
    };
    
    logEntry(`Sending payload to Luma Labs: ${JSON.stringify(lumaPayload).substring(0, 200)}...`);
    
    // Make the API request to Luma Labs
    const lumaResponse = await fetch(LUMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LUMA_API_KEY}`
      },
      body: JSON.stringify(lumaPayload)
    });
    
    // Check if the response was successful
    if (!lumaResponse.ok) {
      const errorText = await lumaResponse.text();
      logEntry(`Luma Labs API error (${lumaResponse.status}): ${errorText}`);
      
      // No fallback - return error as requested
      return new Response(
        JSON.stringify({
          status: "error",
          message: `Luma Labs API error: ${lumaResponse.status} - ${errorText}`,
          logs: logs
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Parse the response
    const lumaData = await lumaResponse.json();
    logEntry('Luma Labs API response received successfully');
    
    // Extract the image from the response - adjust based on actual Luma response format
    if (!lumaData.image || !lumaData.image.url) {
      throw new Error('Could not extract image from Luma Labs response. The response format was unexpected.');
    }
    
    const imageUrl = lumaData.image.url;
    logEntry(`Received image URL from Luma: ${imageUrl}`);
    
    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
    }
    
    // Convert the image to binary data
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const binaryData = new Uint8Array(imageArrayBuffer);
    logEntry(`Downloaded image size: ${binaryData.byteLength} bytes`);
    
    // Save to Supabase Storage in the 'images' bucket
    const imageName = `luma-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(`generated/${imageName}`, binaryData, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      logEntry(`Error uploading Luma image: ${uploadError.message}`);
      throw new Error(`Failed to save Luma image: ${uploadError.message}`);
    }
    
    logEntry(`Successfully uploaded image to storage: ${imageName}`);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(`generated/${imageName}`);
      
    const storedImageUrl = urlData.publicUrl;
    logEntry(`Public URL for image: ${storedImageUrl}`);
    
    // Extract metadata from the prompt
    const metadata = extractMetadata(userPrompt);
    metadata.source = 'luma';
    metadata.is_ai_generated = true;
    
    // Save image metadata to database
    try {
      logEntry('Saving image metadata to database');
      
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          title: metadata.title || 'AI Generated Image',
          description: metadata.description || enhancedPrompt,
          image_url: storedImageUrl,
          image_mobile_url: storedImageUrl,
          image_tablet_url: storedImageUrl,
          image_desktop_url: storedImageUrl,
          year: metadata.year,
          location: metadata.location,
          is_ai_generated: true,
          is_mature_content: metadata.is_mature_content || false,
          accuracy_date: metadata.accuracy_date || 0.95,
          accuracy_location: metadata.accuracy_location || 0.9,
          accuracy_historical: metadata.accuracy_historical || 0.9,
          accuracy_realness: metadata.accuracy_realness || 0.9,
          gps: metadata.gps || { lat: 0, lng: 0 },
          source: 'luma',
          ready_for_game: false,
          prompt: enhancedPrompt,
          logs: logs
        })
        .select()
        .single();
        
      if (imageError) {
        logEntry(`Error saving to database: ${imageError.message}`);
      } else {
        logEntry(`Successfully saved image to database with ID: ${imageData.id}`);
        metadata.id = imageData.id;
      }
    } catch (dbError: any) {
      logEntry(`Database error: ${dbError.message}`);
      // Continue execution even if DB save fails
    }
    
    // Return the successful response
    const result = {
      status: "success",
      imageUrl: storedImageUrl,
      metadata: metadata,
      promptUsed: enhancedPrompt,
      logs: logs
    };
    
    logEntry('Image generation completed successfully');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error: any) {
    logEntry(`ERROR: ${error.message}`);
    
    // Return a structured error response
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message,
        logs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

/**
 * Extract metadata from the prompt
 */
function extractMetadata(prompt: string): any {
  const metadata: any = {
    title: '',
    description: '',
    is_mature_content: false,
    accuracy_date: 0.95,
    gps: { lat: 0, lng: 0 }
  };
  
  // Basic extraction - in a real app you'd use NLP
  const yearMatch = prompt.match(/\b(18|19|20)\d{2}\b/);
  if (yearMatch) {
    metadata.year = parseInt(yearMatch[0]);
  }
  
  // Try to extract a location
  const locationKeywords = ['in', 'at', 'near', 'from'];
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`${keyword} ([A-Z][a-z]+(?: [A-Z][a-z]+)*)`);
    const match = prompt.match(regex);
    if (match && match[1]) {
      metadata.location = match[1];
      break;
    }
  }
  
  // Use the first part as title if not too long
  const firstPart = prompt.split(',')[0];
  if (firstPart && firstPart.length < 60) {
    metadata.title = firstPart;
  } else {
    metadata.title = prompt.substring(0, 50);
  }
  
  metadata.description = prompt;
  
  return metadata;
}
