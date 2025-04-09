
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

interface ProviderConfig {
  name: string;
  endpointUrl: string;
  keyRequired: boolean;
  keyName: string;
  defaultModel: string;
  maxPromptLength: number;
  models: string[];
}

const providerConfigs: Record<string, ProviderConfig> = {
  dalle: {
    name: 'DALL·E',
    endpointUrl: 'https://api.openai.com/v1/models',
    keyRequired: true,
    keyName: 'OPENAI_API_KEY',
    defaultModel: 'dall-e-3',
    maxPromptLength: 4000,
    models: ['dall-e-3', 'dall-e-2']
  },
  midjourney: {
    name: 'Midjourney',
    endpointUrl: 'https://api.midjourney.com/v1/models',
    keyRequired: true,
    keyName: 'MIDJOURNEY_API_KEY',
    defaultModel: 'midjourney-5',
    maxPromptLength: 6000,
    models: ['midjourney-5', 'midjourney-4']
  },
  vertex: {
    name: 'Vertex AI',
    endpointUrl: 'https://us-central1-aiplatform.googleapis.com/v1/models',
    keyRequired: true,
    keyName: 'VERTEX_AI_API_KEY',
    defaultModel: 'imagegeneration',
    maxPromptLength: 4000,
    models: ['imagegeneration']
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { provider } = await req.json();
    
    if (!provider || !providerConfigs[provider]) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid provider' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const config = providerConfigs[provider];
    
    // Get API key from database
    const { data: keyData, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('key_value')
      .eq('key_name', config.keyName)
      .maybeSingle();
      
    if (keyError) {
      throw keyError;
    }
    
    if (!keyData?.key_value) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Test the API connection (implementation varies by provider)
    let testResult = false;
    
    switch (provider) {
      case 'dalle':
        // Test OpenAI connection
        const openaiResponse = await fetch(config.endpointUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${keyData.key_value}`,
            'Content-Type': 'application/json',
          },
        });
        testResult = openaiResponse.status === 200;
        break;
        
      case 'midjourney':
        // Test Midjourney connection (simplified for this example)
        // In reality, we'd need to use the actual Midjourney API endpoints
        const mjResponse = await fetch(config.endpointUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${keyData.key_value}`,
            'Content-Type': 'application/json',
          },
        });
        testResult = mjResponse.status === 200;
        break;
        
      case 'vertex':
        // Get project ID from database
        const { data: projectData, error: projectError } = await supabaseClient
          .from('api_keys')
          .select('key_value')
          .eq('key_name', 'VERTEX_PROJECT_ID')
          .maybeSingle();
          
        if (projectError) {
          throw projectError;
        }
        
        if (!projectData?.key_value) {
          return new Response(
            JSON.stringify({ success: false, error: 'Project ID not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // Test Vertex AI connection
        const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectData.key_value}/locations/us-central1/publishers/google/models`;
        const vertexResponse = await fetch(vertexUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${keyData.key_value}`,
            'Content-Type': 'application/json',
          },
        });
        testResult = vertexResponse.status === 200;
        break;
        
      default:
        testResult = false;
    }
    
    // Log the test result
    await supabaseClient
      .from('api_key_logs')
      .insert({
        key_name: config.keyName,
        action: 'test',
        success: testResult,
        created_at: new Date().toISOString(),
      });
    
    return new Response(
      JSON.stringify({ success: testResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error testing provider connection:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
