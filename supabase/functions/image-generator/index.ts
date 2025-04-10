
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { decode } from 'https://deno.land/std@0.170.0/encoding/base64.ts';

// Constants for API endpoints and configuration
const VERTEX_MODEL_BASE_URL = "https://us-central1-aiplatform.googleapis.com/v1/projects";
const PROJECT_ID = Deno.env.get("VERTEX_PROJECT_ID") || "gen-lang-client-0724142088";
const DEFAULT_MODEL_VERSION = "imagen-3.0-generate-002";
const DEFAULT_ASPECT_RATIO = "1:1";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

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
    logEntry('Starting image generation process');
    
    // Parse the request body
    const requestData = await req.json();
    const { 
      prompt, 
      modelVersion = DEFAULT_MODEL_VERSION,
      aspectRatio = DEFAULT_ASPECT_RATIO,
      addWatermark = false,
      personGeneration = "dont_allow",
      safetyFilterLevel = "block_only_high"
    } = requestData;
    
    // Validate the required prompt parameter
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    logEntry(`Request parameters: model=${modelVersion}, aspectRatio=${aspectRatio}, watermark=${addWatermark}`);
    
    // Enhance the prompt for better results
    const enhancedPrompt = `A photorealistic high-resolution image, taken by a professional war/photojournalist, using a vintage analog camera appropriate to the era. Grainy film, accurate shadows, era-specific lighting. Depict: ${prompt} -- Realistic style, historically accurate, correct clothing and architecture, natural facial expressions, no digital artifacts, consistent perspective, documentary framing.`;
    logEntry(`Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);
    
    // Get OAuth token for authentication
    const accessToken = await getAccessToken();
    logEntry('Successfully obtained OAuth access token');
    
    // Build the request to Vertex AI
    const vertexApiUrl = `${VERTEX_MODEL_BASE_URL}/${PROJECT_ID}/locations/us-central1/publishers/google/models/${modelVersion}:predict`;
    logEntry(`Calling Vertex AI at: ${vertexApiUrl}`);
    
    // Prepare the payload according to Vertex AI specifications
    const vertexPayload = {
      instances: [
        {
          prompt: enhancedPrompt,
          aspectRatio: aspectRatio,
          safetyFilterLevel: safetyFilterLevel,
          personGeneration: personGeneration,
          addWatermark: addWatermark
        }
      ]
    };
    
    logEntry(`Sending payload to Vertex AI: ${JSON.stringify(vertexPayload).substring(0, 200)}...`);
    
    // Function to make the API request with retry capability
    const callVertexApi = async (retryCount = 0): Promise<Response> => {
      const vertexResponse = await fetch(vertexApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(vertexPayload)
      });
      
      // Handle non-200 responses with retry logic for specific status codes
      if (!vertexResponse.ok) {
        const responseText = await vertexResponse.text();
        logEntry(`Vertex AI error (${vertexResponse.status}): ${responseText}`);
        
        // Retry once for 429 (Too Many Requests) or 502 (Bad Gateway)
        if ((vertexResponse.status === 429 || vertexResponse.status === 502) && retryCount < 1) {
          logEntry(`Retrying in 1s due to ${vertexResponse.status} error...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return callVertexApi(retryCount + 1);
        }
        
        throw new Error(`Vertex AI API error (${vertexResponse.status}): ${responseText}`);
      }
      
      return vertexResponse;
    };
    
    // Call Vertex AI and process the response
    const vertexResponse = await callVertexApi();
    const vertexData = await vertexResponse.json();
    logEntry('Vertex API response received successfully');
    
    // Extract the image from the response
    if (!vertexData.predictions || !vertexData.predictions[0] || !vertexData.predictions[0].bytesBase64Encoded) {
      throw new Error('Could not extract image from Vertex AI response. The response format was unexpected.');
    }
    
    const imageBase64 = vertexData.predictions[0].bytesBase64Encoded;
    logEntry('Successfully extracted base64 image from response');
    
    // Decode the base64 image using Deno-compatible method
    const binaryData = decode(imageBase64);
    logEntry(`Decoded image size: ${binaryData.byteLength} bytes`);
    
    // Save to Supabase Storage in the 'images' bucket
    const imageName = `vertex-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(`generated/${imageName}`, binaryData, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      logEntry(`Error uploading Vertex image: ${uploadError.message}`);
      throw new Error(`Failed to save Vertex image: ${uploadError.message}`);
    }
    
    logEntry(`Successfully uploaded image to storage: ${imageName}`);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(`generated/${imageName}`);
      
    const imageUrl = urlData.publicUrl;
    logEntry(`Public URL for image: ${imageUrl}`);
    
    // Extract metadata from the prompt
    const metadata = extractMetadata(prompt);
    metadata.source = 'vertex';
    metadata.is_ai_generated = true;
    
    // Save image metadata to database
    try {
      logEntry('Saving image metadata to database');
      
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          title: metadata.title || 'AI Generated Image',
          description: metadata.description || enhancedPrompt,
          image_url: imageUrl,
          image_mobile_url: imageUrl,
          image_tablet_url: imageUrl,
          image_desktop_url: imageUrl,
          year: metadata.year,
          location: metadata.location,
          is_ai_generated: true,
          is_mature_content: metadata.is_mature_content || false,
          accuracy_date: metadata.accuracy_date || 0.95,
          accuracy_location: metadata.accuracy_location || 0.9,
          accuracy_historical: metadata.accuracy_historical || 0.9,
          accuracy_realness: metadata.accuracy_realness || 0.9,
          gps: metadata.gps || { lat: 0, lng: 0 },
          source: 'vertex',
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
      imageUrl: imageUrl,
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
 * Get an OAuth access token for authenticating with Vertex AI
 */
async function getAccessToken(): Promise<string> {
  try {
    // First check if we have a service account JSON
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (serviceAccountJson) {
      // Parse the service account JSON
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      // Create a JWT for OAuth token exchange
      const now = Math.floor(Date.now() / 1000);
      const expiry = now + 3600; // 1 hour expiry
      
      const jwt_payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: OAUTH_TOKEN_URL,
        iat: now,
        exp: expiry,
        scope: "https://www.googleapis.com/auth/cloud-platform"
      };
      
      // In a production environment, you would sign the JWT with the private key
      // For now, as we're using a pre-generated token, we'll use that directly
    }
    
    // For development, we can use a pre-generated access token
    // In production, this should be replaced with proper JWT signing and token exchange
    const accessToken = Deno.env.get("VERTEX_AI_API_KEY");
    if (!accessToken) {
      throw new Error("No authentication credentials found. Please set VERTEX_AI_API_KEY or GOOGLE_SERVICE_ACCOUNT");
    }
    
    return accessToken;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

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
