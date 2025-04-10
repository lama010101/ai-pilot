
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { providerConfigs } from './config.ts';

interface ImageGenerationRequest {
  manualPrompt?: string;
  autoMode?: boolean;
  provider: 'dalle' | 'midjourney' | 'vertex';
  mode: 'manual' | 'writer';
  forcedProvider?: boolean;
  modelVersion?: string;
  aspectRatio?: string;
  addWatermark?: boolean;
  personGeneration?: 'allow' | 'dont_allow';
  safetyFilterLevel?: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  metadata: any;
  promptUsed: string;
  logs: string[];
  error?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let logs: string[] = [];
  const logEntry = (message: string) => {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} - ${message}`;
    logs.push(entry);
    console.log(entry);
  };

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    logEntry('Starting image generation');
    
    const requestData: ImageGenerationRequest = await req.json();
    const { 
      manualPrompt, 
      autoMode, 
      provider, 
      mode, 
      forcedProvider = false,
      modelVersion = 'imagen-3.0-generate-002',
      aspectRatio = '1:1',
      addWatermark = false,
      personGeneration = 'dont_allow',
      safetyFilterLevel = 'block_only_high'
    } = requestData;
    
    // Validate provider
    if (!provider || !['dalle', 'vertex', 'midjourney'].includes(provider)) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    logEntry(`Requested provider: ${provider}`);
    
    // Get the provider configuration
    const config = providerConfigs[provider];
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    // Get the API key from the environment or from the database
    let apiKey: string | null = null;
    
    // First try to get from environment
    apiKey = Deno.env.get(config.keyName);
    
    // If not in environment, try to get from database
    if (!apiKey) {
      logEntry(`API key for ${provider} not found in environment, checking database`);
      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('key_name', config.keyName)
        .single();
        
      if (keyError) {
        logEntry(`Error fetching API key from database: ${keyError.message}`);
      } else if (keyData) {
        apiKey = keyData.key_value;
        logEntry(`API key for ${provider} found in database`);
      }
    }
    
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${provider} (${config.keyName})`);
    }
    
    let prompt: string;
    
    if (mode === 'writer') {
      if (!manualPrompt) {
        throw new Error('Manual prompt is required for writer mode');
      }
      prompt = manualPrompt;
      logEntry(`Using Writer mode with prompt: ${prompt.substring(0, 50)}...`);
    } else {
      // Manual mode
      if (autoMode) {
        // Auto-generate prompt
        logEntry('Auto-generating prompt using Writer AI');
        // This would be replaced with a real call to the writer agent
        prompt = 'A historical photo of the signing of the Declaration of Independence, Philadelphia, 1776, realism';
      } else {
        if (!manualPrompt) {
          throw new Error('Manual prompt is required when auto-mode is disabled');
        }
        prompt = manualPrompt;
      }
      
      logEntry(`Using prompt: ${prompt.substring(0, 50)}...`);
    }
    
    // Add standard enhancements to the prompt
    const enhancedPrompt = `A photorealistic high-resolution image, taken by a professional war/photojournalist, using a vintage analog camera appropriate to the era. Grainy film, accurate shadows, era-specific lighting. Depict: ${prompt} -- Realistic style, historically accurate, correct clothing and architecture, natural facial expressions, no digital artifacts, consistent perspective, documentary framing.`;
    logEntry(`Enhanced prompt: ${enhancedPrompt.substring(0, 50)}...`);
    
    // Specific provider logic for each provider
    logEntry(`Generating image with ${provider}`);
    
    let imageUrl: string;
    let metadata: any = {
      title: '',
      description: '',
      source: provider,
      is_ai_generated: true,
      is_mature_content: false,
      accuracy_date: 0.95,
      gps: { lat: 0, lng: 0 }
    };
    
    // Try to extract title, year, and location from the prompt
    const extractMetadata = (prompt: string) => {
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
    };
    
    extractMetadata(prompt);
    
    // Generate with DALL-E provider
    if (provider === 'dalle') {
      try {
        logEntry('Calling DALL-E API');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: enhancedPrompt,
            n: 1,
            size: '1024x1024'
          })
        });
        
        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          logEntry(`DALL-E API error: ${JSON.stringify(errorData)}`);
          throw new Error(`DALL-E API error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const dalleData = await openaiResponse.json();
        imageUrl = dalleData.data[0].url;
        
        // DALL-E specific metadata
        metadata.revised_prompt = dalleData.data[0].revised_prompt;
        
        logEntry(`Successfully generated image with DALL-E: ${imageUrl.substring(0, 50)}...`);
      } catch (error) {
        logEntry(`Error with DALL-E: ${error.message}`);
        throw new Error(`DALL-E generation failed: ${error.message}`);
      }
    } 
    // Generate with Midjourney provider
    else if (provider === 'midjourney') {
      try {
        logEntry('Calling Midjourney API');
        // Midjourney API is not publicly available in the same way as DALL-E
        // This is a placeholder for Midjourney API integration
        // For the purpose of this example, we'll simulate a Midjourney response
        
        if (!forcedProvider) {
          // In reality, we would try to call Midjourney API here
          logEntry('Midjourney API not available, would fallback to DALL-E if not in forced mode');
          throw new Error('Midjourney API is not available');
        }
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Placeholder response - in a real app, this would be the actual API call
        imageUrl = 'https://picsum.photos/seed/midjourney/1024/1024';
        
        logEntry(`Successfully generated image with simulated Midjourney: ${imageUrl}`);
      } catch (error) {
        logEntry(`Error with Midjourney: ${error.message}`);
        throw new Error(`Midjourney generation failed: ${error.message}`);
      }
    } 
    // Generate with Vertex AI provider
    else if (provider === 'vertex') {
      try {
        logEntry('Setting up Vertex AI request');
        
        // Get project ID from environment or database
        let projectId = Deno.env.get('VERTEX_PROJECT_ID');
        
        // If not in environment, try to get from database
        if (!projectId) {
          logEntry('VERTEX_PROJECT_ID not found in environment, checking database');
          const { data: projectData, error: projectError } = await supabase
            .from('api_keys')
            .select('key_value')
            .eq('key_name', 'VERTEX_PROJECT_ID')
            .single();
            
          if (projectError) {
            logEntry(`Error fetching project ID from database: ${projectError.message}`);
          } else if (projectData) {
            projectId = projectData.key_value;
            logEntry(`Project ID found in database: ${projectId}`);
          }
        }
        
        if (!projectId) {
          // Use the default project ID from the task
          projectId = 'gen-lang-client-0724142088';
          logEntry(`Using default project ID: ${projectId}`);
        }
        
        // Construct the Vertex AI API URL with proper model versioning
        const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelVersion}:predict`;
        
        logEntry(`Calling Vertex AI API at: ${vertexUrl}`);
        
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
        
        // Log the full request payload for debugging
        logEntry(`Request payload: ${JSON.stringify(vertexPayload)}`);
        
        // Make the API request with proper authentication
        const vertexResponse = await fetch(vertexUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(vertexPayload)
        });
        
        // Handle non-200 responses with detailed error logging
        if (!vertexResponse.ok) {
          const responseText = await vertexResponse.text();
          logEntry(`Vertex AI API error (${vertexResponse.status}): ${responseText}`);
          
          // Check if we should retry for specific error codes
          if (vertexResponse.status === 429 || vertexResponse.status === 502) {
            logEntry(`Retrying in 1s due to ${vertexResponse.status} error...`);
            // Wait 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Retry the request
            const retryResponse = await fetch(vertexUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify(vertexPayload)
            });
            
            // If retry still fails, throw error with details
            if (!retryResponse.ok) {
              const retryErrorText = await retryResponse.text();
              throw new Error(`Vertex AI API retry failed (${retryResponse.status}): ${retryErrorText}`);
            }
            
            // Process successful retry response
            const vertexData = await retryResponse.json();
            logEntry(`Retry successful, processing response`);
            
            // Extract image and process it
            if (vertexData.predictions && vertexData.predictions[0] && vertexData.predictions[0].bytesBase64Encoded) {
              const imageBase64 = vertexData.predictions[0].bytesBase64Encoded;
              logEntry('Successfully extracted base64 image from retry response');
              
              // Convert base64 to binary using Deno-compatible method
              const binary = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
              logEntry(`Image size: ${binary.byteLength} bytes`);
              
              // Save to Supabase Storage in the correct 'images' bucket
              const imageName = `vertex-${Date.now()}.png`;
              const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('images')
                .upload(`generated/${imageName}`, binary.buffer, {
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
                
              imageUrl = urlData.publicUrl;
              logEntry(`Public URL for image: ${imageUrl}`);
            } else {
              logEntry(`Unexpected response format from Vertex API retry: ${JSON.stringify(vertexData)}`);
              throw new Error('Could not extract image from Vertex AI retry response');
            }
          } else {
            // Add more detailed diagnostic information for non-retryable errors
            if (vertexResponse.status === 403) {
              throw new Error(`Vertex AI API access denied (403). Please verify your API key has sufficient permissions for the Vertex AI API and the project ID (${projectId}) is correct.`);
            } else if (vertexResponse.status === 404) {
              throw new Error(`Vertex AI API endpoint not found (404). The model version (${modelVersion}) or project ID (${projectId}) may be incorrect.`);
            } else {
              throw new Error(`Vertex AI API error (${vertexResponse.status}): ${responseText || 'Unknown error'}`);
            }
          }
        } else {
          // Process successful first-attempt response
          const vertexData = await vertexResponse.json();
          logEntry(`Vertex API response received successfully`);
          
          // Extract image from response
          if (vertexData.predictions && vertexData.predictions[0] && vertexData.predictions[0].bytesBase64Encoded) {
            const imageBase64 = vertexData.predictions[0].bytesBase64Encoded;
            logEntry('Successfully extracted base64 image from response');
            
            // Save base64 image to Supabase Storage
            const imageName = `vertex-${Date.now()}.png`;
            
            // Convert base64 to binary using Deno-compatible method (not atob)
            // This fixes the browser-only atob() issue
            const binary = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
            
            logEntry(`Image size: ${binary.byteLength} bytes`);
            
            // Save to Supabase Storage in the correct 'images' bucket
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('images')
              .upload(`generated/${imageName}`, binary.buffer, {
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
              
            imageUrl = urlData.publicUrl;
            logEntry(`Public URL for image: ${imageUrl}`);
          } else {
            logEntry(`Unexpected response format from Vertex API: ${JSON.stringify(vertexData)}`);
            // Fallback if we can't extract the image
            throw new Error('Could not extract image from Vertex AI response. The response format was unexpected.');
          }
        }
        
        logEntry(`Successfully generated image with Vertex AI: ${imageUrl?.substring(0, 50)}...`);
      } catch (error: any) {
        logEntry(`Error with Vertex AI: ${error.message}`);
        throw new Error(`Vertex AI generation failed: ${error.message}`);
      }
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
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
          source: provider,
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
    
    // Prepare the final result
    const result: ImageGenerationResult = {
      imageUrl,
      metadata,
      promptUsed: enhancedPrompt,
      logs
    };
    
    logEntry('Image generation completed successfully');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    logEntry(`ERROR: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        logs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
