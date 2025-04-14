
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { decode } from 'https://deno.land/std@0.170.0/encoding/base64.ts';

// Constants for API endpoints and configuration
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

// Get API key from Supabase
async function getApiKey(keyName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('key_name', keyName)
      .maybeSingle();
      
    if (error) throw error;
    return data?.key_value || null;
  } catch (error) {
    console.error(`Error getting API key ${keyName}:`, error);
    return null;
  }
}

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
    const { prompt, provider = 'luma', forcedProvider = false } = requestData;
    
    // Use a default test prompt if none provided
    const userPrompt = prompt || "A photorealistic crowd scene in the 1950s";
    
    logEntry(`Request received with prompt: ${userPrompt.substring(0, 100)}...`);
    logEntry(`Using provider: ${provider}`);
    
    // Enhance the prompt for better results
    const enhancedPrompt = `A photorealistic high-resolution image, taken by a professional war/photojournalist, using a vintage analog camera appropriate to the era. Grainy film, accurate shadows, era-specific lighting. Depict: ${userPrompt} -- Realistic style, historically accurate, correct clothing and architecture, natural facial expressions, no digital artifacts, consistent perspective, documentary framing.`;
    logEntry(`Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);
    
    // Initialize variables for the response
    let imageUrl = '';
    let imageArrayBuffer: ArrayBuffer | null = null;
    let providerUsed = provider;
    let authMethodUsed = '';
    
    // Use the selected provider with no fallbacks
    if (provider === 'luma') {
      // Call Luma Labs API
      logEntry(`Calling Luma Labs API`);
      
      // Prepare the payload for Luma Labs
      const lumaPayload = {
        prompt: enhancedPrompt,
        // Using defaults for other parameters
      };
      
      logEntry(`Sending payload to Luma Labs: ${JSON.stringify(lumaPayload).substring(0, 200)}...`);
      
      // Make the API request to Luma Labs
      const lumaResponse = await fetch('https://lumalabs.ai/api/generate', {
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
        throw new Error(`Luma Labs API error: ${lumaResponse.status} - ${errorText}`);
      }
      
      // Parse the response
      const lumaData = await lumaResponse.json();
      logEntry('Luma Labs API response received successfully');
      
      // Extract the image from the response
      if (!lumaData.image || !lumaData.image.url) {
        throw new Error('Could not extract image from Luma Labs response. The response format was unexpected.');
      }
      
      imageUrl = lumaData.image.url;
      logEntry(`Received image URL from Luma: ${imageUrl}`);
      
      // Fetch the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
      }
      
      // Convert the image to binary data
      imageArrayBuffer = await imageResponse.arrayBuffer();
      
    } else if (provider === 'vertex') {
      // Call Vertex AI API
      logEntry(`Calling Vertex AI API`);
      
      // Check if JSON credentials exist first
      const jsonExists = await getApiKey('VERTEX_AI_JSON_EXISTS');
      
      if (jsonExists === 'true') {
        // Try JSON credentials first
        const jsonCredentials = await getApiKey('VERTEX_AI_JSON_CREDENTIALS');
        
        if (jsonCredentials) {
          logEntry('Using Vertex AI JSON credentials');
          authMethodUsed = 'JSON';
          
          try {
            // Parse the JSON credentials
            const credentials = JSON.parse(jsonCredentials);
            
            if (!credentials.private_key || !credentials.client_email || !credentials.project_id) {
              throw new Error("Invalid JSON credentials format. Missing required fields.");
            }
            
            // For JWT token generation, we need crypto and encode functions
            const encodeBase64Url = (buffer: ArrayBuffer): string => {
              return btoa(String.fromCharCode(...new Uint8Array(buffer)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            };
            
            // Generate JWT token for authentication
            const generateJwt = async (): Promise<string> => {
              const header = { alg: "RS256", typ: "JWT" };
              const now = Math.floor(Date.now() / 1000);
              const expiry = now + 3600; // 1 hour
              
              const payload = {
                iss: credentials.client_email,
                sub: credentials.client_email,
                aud: "https://aiplatform.googleapis.com/",
                iat: now,
                exp: expiry,
                scope: "https://www.googleapis.com/auth/cloud-platform"
              };
              
              const headerB64 = encodeBase64Url(new TextEncoder().encode(JSON.stringify(header)));
              const payloadB64 = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
              
              const signatureInput = `${headerB64}.${payloadB64}`;
              
              // Convert PEM private key to CryptoKey
              const privateKey = credentials.private_key.replace(/\\n/g, '\n');
              const pemHeader = "-----BEGIN PRIVATE KEY-----";
              const pemFooter = "-----END PRIVATE KEY-----";
              const pemContents = privateKey.substring(
                privateKey.indexOf(pemHeader) + pemHeader.length,
                privateKey.indexOf(pemFooter)
              ).replace(/\s/g, '');
              
              const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
              
              const cryptoKey = await crypto.subtle.importKey(
                "pkcs8",
                binaryDer,
                {
                  name: "RSASSA-PKCS1-v1_5",
                  hash: "SHA-256"
                },
                false,
                ["sign"]
              );
              
              const signature = await crypto.subtle.sign(
                { name: "RSASSA-PKCS1-v1_5" },
                cryptoKey,
                new TextEncoder().encode(signatureInput)
              );
              
              const signatureB64 = encodeBase64Url(signature);
              
              return `${signatureInput}.${signatureB64}`;
            };
            
            // Get JWT token
            const jwt = await generateJwt();
            
            // Get access token
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt
              })
            });
            
            if (!tokenResponse.ok) {
              const errorText = await tokenResponse.text();
              throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
            }
            
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            
            if (!accessToken) {
              throw new Error("Failed to get access token from Google OAuth");
            }
            
            // Generate image with Vertex AI
            const projectId = credentials.project_id;
            const location = "us-central1";
            const publisherModel = "imagegeneration@002";
            
            const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${publisherModel}:predict`;
            
            const vertexRequest = {
              instances: [
                {
                  prompt: enhancedPrompt
                }
              ],
              parameters: {
                sampleCount: 1
              }
            };
            
            logEntry(`Sending request to Vertex AI using JSON auth: ${JSON.stringify(vertexRequest).substring(0, 200)}...`);
            
            const vertexResponse = await fetch(vertexEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
              },
              body: JSON.stringify(vertexRequest)
            });
            
            if (!vertexResponse.ok) {
              const errorText = await vertexResponse.text();
              throw new Error(`Vertex AI API error: ${vertexResponse.status} - ${errorText}`);
            }
            
            const vertexData = await vertexResponse.json();
            logEntry('Vertex AI API response (JSON auth) received successfully');
            
            // Check if the response contains the image data
            if (!vertexData.predictions || !vertexData.predictions[0] || !vertexData.predictions[0].bytesBase64Encoded) {
              throw new Error("Unexpected response format from Vertex AI. The response format was unexpected.");
            }
            
            // Decode the base64 image data
            const base64Data = vertexData.predictions[0].bytesBase64Encoded;
            const binaryData = decode(base64Data);
            
            imageArrayBuffer = binaryData.buffer;
            logEntry(`Received base64 image from Vertex (JSON auth), size: ${base64Data.length} chars`);
            
          } catch (jsonError) {
            // If JSON auth fails, log the error and fall back to API key
            logEntry(`Error using JSON credentials: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
            logEntry('Falling back to API Key method');
            
            // Continue to API key method below
            authMethodUsed = 'API Key (fallback)';
          }
        }
      }
      
      // If we haven't got an image yet (JSON auth failed or not present), try API key
      if (!imageArrayBuffer) {
        // Get Vertex API key and project ID
        const vertexApiKey = await getApiKey('VERTEX_AI_API_KEY');
        const projectId = await getApiKey('VERTEX_PROJECT_ID');
        
        if (!vertexApiKey || !projectId) {
          logEntry('Vertex AI API key or project ID not found');
          throw new Error('Vertex AI API key or project ID not configured');
        }
        
        if (!authMethodUsed) {
          authMethodUsed = 'API Key';
        }
        
        logEntry(`Using Vertex AI API Key authentication method`);
        
        // Format the endpoint URL with the project ID
        const vertexEndpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;
        
        // Prepare the payload for Vertex AI
        const vertexPayload = {
          instances: [
            {
              prompt: enhancedPrompt
            }
          ],
          parameters: {
            sampleCount: 1
          }
        };
        
        logEntry(`Sending payload to Vertex AI: ${JSON.stringify(vertexPayload).substring(0, 200)}...`);
        
        // Make the API request to Vertex AI
        const vertexResponse = await fetch(vertexEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vertexApiKey}`
          },
          body: JSON.stringify(vertexPayload)
        });
        
        // Check if the response was successful
        if (!vertexResponse.ok) {
          const errorText = await vertexResponse.text();
          logEntry(`Vertex AI API error (${vertexResponse.status}): ${errorText}`);
          throw new Error(`Vertex AI API error: ${vertexResponse.status} - ${errorText}`);
        }
        
        // Parse the response
        const vertexData = await vertexResponse.json();
        logEntry('Vertex AI API response received successfully');
        
        // Extract the image from the response
        if (!vertexData.predictions || !vertexData.predictions[0] || !vertexData.predictions[0].bytesBase64Encoded) {
          throw new Error('Could not extract image from Vertex AI response. The response format was unexpected.');
        }
        
        // Decode the base64 image data
        const base64Data = vertexData.predictions[0].bytesBase64Encoded;
        const binaryData = decode(base64Data);
        
        imageArrayBuffer = binaryData.buffer;
        logEntry(`Received base64 image from Vertex, size: ${base64Data.length} chars`);
      }
      
    } else if (provider === 'dalle') {
      // Call OpenAI DALL·E API
      logEntry(`Calling OpenAI DALL·E API`);
      
      // Get OpenAI API key
      const openaiApiKey = await getApiKey('OPENAI_API_KEY');
      
      if (!openaiApiKey) {
        logEntry('OpenAI API key not found');
        throw new Error('OpenAI API key not configured');
      }
      
      // Prepare the payload for DALL·E
      const dallePayload = {
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        model: "dall-e-3"
      };
      
      logEntry(`Sending payload to DALL·E: ${JSON.stringify(dallePayload).substring(0, 200)}...`);
      
      // Make the API request to OpenAI
      const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify(dallePayload)
      });
      
      // Check if the response was successful
      if (!dalleResponse.ok) {
        const errorText = await dalleResponse.text();
        logEntry(`DALL·E API error (${dalleResponse.status}): ${errorText}`);
        throw new Error(`DALL·E API error: ${dalleResponse.status} - ${errorText}`);
      }
      
      // Parse the response
      const dalleData = await dalleResponse.json();
      logEntry('DALL·E API response received successfully');
      
      // Extract the image from the response
      if (!dalleData.data || !dalleData.data[0] || !dalleData.data[0].url) {
        throw new Error('Could not extract image from DALL·E response. The response format was unexpected.');
      }
      
      imageUrl = dalleData.data[0].url;
      logEntry(`Received image URL from DALL·E: ${imageUrl}`);
      
      // Fetch the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
      }
      
      // Convert the image to binary data
      imageArrayBuffer = await imageResponse.arrayBuffer();
      
    } else {
      logEntry(`Invalid provider: ${provider}`);
      throw new Error(`Invalid provider: ${provider}. Supported providers are: luma, vertex, dalle`);
    }
    
    if (!imageArrayBuffer) {
      throw new Error('Failed to get image data from provider');
    }
    
    // Convert the binary data to a Uint8Array
    const binaryData = new Uint8Array(imageArrayBuffer);
    logEntry(`Downloaded image size: ${binaryData.byteLength} bytes`);
    
    // Save to Supabase Storage in the 'images' bucket
    const imageName = `${providerUsed}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(`generated/${imageName}`, binaryData, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      logEntry(`Error uploading image: ${uploadError.message}`);
      throw new Error(`Failed to save image: ${uploadError.message}`);
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
    metadata.source = providerUsed;
    metadata.authMethod = authMethodUsed;
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
          year: metadata.year,
          location: metadata.location,
          is_ai_generated: true,
          is_mature_content: metadata.is_mature_content || false,
          accuracy_date: metadata.accuracy_date || 0.95,
          accuracy_location: metadata.accuracy_location || 0.9,
          accuracy_historical: metadata.accuracy_historical || 0.9,
          accuracy_realness: metadata.accuracy_realness || 0.9,
          gps: metadata.gps || { lat: 0, lng: 0 },
          source: providerUsed,
          auth_method: authMethodUsed,
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
      logs: logs,
      provider: providerUsed,
      authMethod: authMethodUsed
    };
    
    logEntry(`Image generation completed successfully using provider: ${providerUsed} (Auth: ${authMethodUsed})`);
    
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
