
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test OpenAI/DALL-E connection
async function testDallEConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing DALL-E connection:', error);
    return false;
  }
}

// Test Vertex AI connection
async function testVertexConnection(apiKey: string, projectId: string): Promise<boolean> {
  try {
    // For Vertex, we'll test if we can list models or access their API
    const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/models`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing Vertex AI connection:', error);
    return false;
  }
}

// Test Midjourney connection (placeholder)
async function testMidjourneyConnection(apiKey: string): Promise<boolean> {
  // Midjourney doesn't have a public API yet, so this is a placeholder
  console.log('Testing Midjourney connection is not implemented yet');
  return false;
}

serve(async (req) => {
  console.log(`Received ${req.method} request to test-provider-connection`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { provider } = await req.json();
    
    if (!provider) {
      throw new Error('Provider is required');
    }
    
    let success = false;
    
    // Get the appropriate API key from Supabase
    switch (provider) {
      case 'dalle':
        const openaiKey = Deno.env.get('OPENAI_API_KEY') || '';
        if (!openaiKey) {
          throw new Error('OpenAI API key is not configured');
        }
        success = await testDallEConnection(openaiKey);
        break;
        
      case 'vertex':
        const vertexKey = Deno.env.get('VERTEX_AI_API_KEY') || '';
        const projectId = Deno.env.get('VERTEX_PROJECT_ID') || '';
        
        if (!vertexKey) {
          throw new Error('Vertex AI API key is not configured');
        }
        
        if (!projectId) {
          throw new Error('Vertex AI Project ID is not configured');
        }
        
        success = await testVertexConnection(vertexKey, projectId);
        break;
        
      case 'midjourney':
        const midjourneyKey = Deno.env.get('MIDJOURNEY_API_KEY') || '';
        if (!midjourneyKey) {
          throw new Error('Midjourney API key is not configured');
        }
        success = await testMidjourneyConnection(midjourneyKey);
        break;
        
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    return new Response(
      JSON.stringify({ success }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-provider-connection:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
