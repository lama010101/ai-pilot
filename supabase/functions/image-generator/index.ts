
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { providerConfigs } from './config.ts';

interface ImageGenerationRequest {
  manualPrompt?: string;
  autoMode?: boolean;
  provider: 'dalle' | 'midjourney' | 'vertex';
  mode: 'manual' | 'writer';
  forcedProvider?: boolean;
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
    const { manualPrompt, autoMode, provider, mode, forcedProvider = false } = requestData;
    
    logEntry(`Requested provider: ${provider}`);
    
    // Get the provider configuration
    const config = providerConfigs[provider];
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    // Get the API key from the environment
    const apiKey = Deno.env.get(config.keyName);
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
        // TODO: Call writer agent for auto-prompting
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
    const enhancedPrompt = `${prompt}. Photorealistic, ultra-detailed, 50 mm lens, natural lighting`;
    logEntry(`Enhanced prompt: ${enhancedPrompt.substring(0, 50)}...`);
    
    // Specific provider logic for each provider
    logEntry(`Generating image with ${provider}`);
    
    let imageUrl: string;
    let metadata: any = {
      title: '',
      description: '',
      source: provider,
      is_ai_generated: true
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
        
        // Get project ID from environment
        const projectId = Deno.env.get('VERTEX_PROJECT_ID');
        if (!projectId) {
          throw new Error('VERTEX_PROJECT_ID is not set');
        }
        
        // Construct the Vertex AI API URL
        const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict`;
        
        logEntry(`Calling Vertex AI API at: ${vertexUrl}`);
        
        const vertexResponse = await fetch(vertexUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            instances: [
              {
                prompt: enhancedPrompt
              }
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: "1:1"
            }
          })
        });
        
        if (!vertexResponse.ok) {
          const errorText = await vertexResponse.text();
          logEntry(`Vertex AI API error: ${errorText}`);
          
          if (vertexResponse.status === 403) {
            throw new Error('Vertex AI API access denied. Please check your API key and project ID.');
          } else {
            throw new Error(`Vertex AI API error: ${errorText || 'Unknown error'}`);
          }
        }
        
        const vertexData = await vertexResponse.json();
        
        // Extract image from response
        // The actual structure depends on Vertex AI's response format
        if (vertexData.predictions && vertexData.predictions[0] && vertexData.predictions[0].bytesBase64Encoded) {
          // In a real implementation, you'd save this base64 image to storage
          // For this example, we'll use a placeholder URL
          imageUrl = `data:image/png;base64,${vertexData.predictions[0].bytesBase64Encoded}`;
          
          // Save base64 image to Supabase Storage
          const imageName = `vertex-${Date.now()}.png`;
          const imageBase64 = vertexData.predictions[0].bytesBase64Encoded;
          
          // Convert base64 to binary
          const binary = atob(imageBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          
          // Save to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('avatars')
            .upload(`images/${imageName}`, bytes.buffer, {
              contentType: 'image/png',
              cacheControl: '3600'
            });
            
          if (uploadError) {
            logEntry(`Error uploading Vertex image: ${uploadError.message}`);
            throw new Error(`Failed to save Vertex image: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(`images/${imageName}`);
            
          imageUrl = urlData.publicUrl;
        } else {
          // Fallback if we can't extract the image
          throw new Error('Could not extract image from Vertex AI response');
        }
        
        logEntry(`Successfully generated image with Vertex AI: ${imageUrl.substring(0, 50)}...`);
      } catch (error) {
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
    } catch (dbError) {
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
  } catch (error) {
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
