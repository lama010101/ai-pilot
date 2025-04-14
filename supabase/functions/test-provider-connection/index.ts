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

// Test OpenAI/DALL-E connection with real image generation
async function testDallEConnection(apiKey: string, testMode = false, prompt?: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    if (!testMode) {
      // Just do a models list call for quick verification
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      return { success: response.ok };
    }
    
    // Generate a real test image
    const testPrompt = prompt || "A simple landscape with mountains and a lake";
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: testPrompt,
        n: 1,
        size: "1024x1024"
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      return { 
        success: false, 
        error: `DALL-E API error: ${response.status} - ${errorData}`
      };
    }
    
    const data = await response.json();
    if (!data.data || !data.data[0] || !data.data[0].url) {
      return { 
        success: false, 
        error: "Unexpected response format from DALL-E API"
      };
    }
    
    // Return success with the image URL
    return { 
      success: true,
      imageUrl: data.data[0].url
    };
  } catch (error) {
    console.error('Error testing DALL-E connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Test Vertex AI connection using JSON credentials
async function testVertexWithJsonCredentials(jsonCredentials: string, testMode = false, prompt?: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // Parse the JSON credentials
    const credentials = JSON.parse(jsonCredentials);
    
    if (!credentials.private_key || !credentials.client_email || !credentials.project_id) {
      return { 
        success: false, 
        error: "Invalid JSON credentials format. Missing required fields."
      };
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
      return { 
        success: false, 
        error: `Failed to get access token: ${tokenResponse.status} - ${errorText}`
      };
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return { 
        success: false, 
        error: "Failed to get access token from Google OAuth"
      };
    }
    
    // If we're not in test mode, just return success since we were able to get an access token
    if (!testMode) {
      return { success: true };
    }
    
    // Generate a test image with Vertex AI
    const projectId = credentials.project_id;
    const location = "us-central1";
    const publisherModel = "imagegeneration@002";
    
    const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${publisherModel}:predict`;
    
    const testPrompt = prompt || "A simple landscape with mountains and a lake";
    
    const vertexRequest = {
      instances: [
        {
          prompt: testPrompt
        }
      ],
      parameters: {
        sampleCount: 1
      }
    };
    
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
      return { 
        success: false, 
        error: `Vertex AI API error: ${vertexResponse.status} - ${errorText}`
      };
    }
    
    const vertexData = await vertexResponse.json();
    
    // Check if the response contains the image data
    if (!vertexData.predictions || !vertexData.predictions[0] || !vertexData.predictions[0].bytesBase64Encoded) {
      return { 
        success: false, 
        error: "Unexpected response format from Vertex AI"
      };
    }
    
    // Convert base64 to an image and save to storage
    const base64Image = vertexData.predictions[0].bytesBase64Encoded;
    const binaryData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    
    // Upload to storage
    const fileName = `test-vertex-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(`test/${fileName}`, binaryData, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      return { 
        success: false, 
        error: `Failed to upload test image: ${uploadError.message}`
      };
    }
    
    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('images')
      .getPublicUrl(`test/${fileName}`);
    
    return { 
      success: true,
      imageUrl: urlData.publicUrl,
      authMethod: "JSON"
    };
  } catch (error) {
    console.error('Error testing Vertex AI with JSON credentials:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Test Vertex AI connection with API key
async function testVertexConnection(apiKey: string, projectId: string, testMode = false, prompt?: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // If not in test mode, just check if we can access the API
    if (!testMode) {
      // For quick verification, try to list models
      const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/models`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      return { success: response.ok };
    }
    
    // For test mode, try to generate a real image
    const location = "us-central1";
    const publisherModel = "imagegeneration@002";
    
    const vertexEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${publisherModel}:predict`;
    
    const testPrompt = prompt || "A simple landscape with mountains and a lake";
    
    const vertexRequest = {
      instances: [
        {
          prompt: testPrompt
        }
      ],
      parameters: {
        sampleCount: 1
      }
    };
    
    const vertexResponse = await fetch(vertexEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(vertexRequest)
    });
    
    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      return { 
        success: false, 
        error: `Vertex AI API error: ${vertexResponse.status} - ${errorText}`
      };
    }
    
    const vertexData = await vertexResponse.json();
    
    // Check if the response contains the image data
    if (!vertexData.predictions || !vertexData.predictions[0] || !vertexData.predictions[0].bytesBase64Encoded) {
      return { 
        success: false, 
        error: "Unexpected response format from Vertex AI"
      };
    }
    
    // Convert base64 to an image and save to storage
    const base64Image = vertexData.predictions[0].bytesBase64Encoded;
    const binaryData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    
    // Upload to storage
    const fileName = `test-vertex-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(`test/${fileName}`, binaryData, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      return { 
        success: false, 
        error: `Failed to upload test image: ${uploadError.message}`
      };
    }
    
    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('images')
      .getPublicUrl(`test/${fileName}`);
    
    return { 
      success: true,
      imageUrl: urlData.publicUrl,
      authMethod: "API Key"
    };
  } catch (error) {
    console.error('Error testing Vertex AI connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Test Midjourney connection (placeholder)
async function testMidjourneyConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  // Midjourney doesn't have a public API yet, so this is a placeholder
  console.log('Testing Midjourney connection is not implemented yet');
  return { success: false, error: "Midjourney API integration is not available yet" };
}

serve(async (req) => {
  console.log(`Received ${req.method} request to test-provider-connection`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { provider, testMode = false, prompt } = await req.json();
    
    if (!provider) {
      throw new Error('Provider is required');
    }
    
    let success = false;
    let result: any = { success: false };
    
    // Get the appropriate API key from Supabase
    switch (provider) {
      case 'dalle':
        const openaiKey = await getApiKey('OPENAI_API_KEY');
        if (!openaiKey) {
          throw new Error('OpenAI API key is not configured');
        }
        result = await testDallEConnection(openaiKey, testMode, prompt);
        break;
        
      case 'vertex':
        // First check if JSON credentials exist
        const jsonExists = await getApiKey('VERTEX_AI_JSON_EXISTS');
        
        if (jsonExists === 'true') {
          // Try JSON credentials first
          const jsonCredentials = await getApiKey('VERTEX_AI_JSON_CREDENTIALS');
          
          if (jsonCredentials) {
            console.log('Testing Vertex AI with JSON credentials');
            result = await testVertexWithJsonCredentials(jsonCredentials, testMode, prompt);
            
            // If JSON credentials test succeeds, return the result
            if (result.success) {
              break;
            }
            
            // Otherwise, log the error and try API key as fallback
            console.log('JSON credentials failed, falling back to API key:', result.error);
          }
        }
        
        // Fallback to API key
        const vertexKey = await getApiKey('VERTEX_AI_API_KEY');
        const projectId = await getApiKey('VERTEX_PROJECT_ID');
        
        if (!vertexKey) {
          throw new Error('Vertex AI API key is not configured');
        }
        
        if (!projectId) {
          throw new Error('Vertex AI Project ID is not configured');
        }
        
        console.log('Testing Vertex AI with API key');
        result = await testVertexConnection(vertexKey, projectId, testMode, prompt);
        break;
        
      case 'midjourney':
        const midjourneyKey = await getApiKey('MIDJOURNEY_API_KEY');
        if (!midjourneyKey) {
          throw new Error('Midjourney API key is not configured');
        }
        result = await testMidjourneyConnection(midjourneyKey);
        break;
        
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-provider-connection:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
