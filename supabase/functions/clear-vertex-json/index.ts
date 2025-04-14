
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

serve(async (req) => {
  console.log(`Received ${req.method} request to clear-vertex-json`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Update flags to indicate JSON credentials do not exist
    const { error: flagError } = await supabase
      .from('api_keys')
      .update({ 
        key_value: 'false',
        updated_at: new Date().toISOString()
      })
      .eq('key_name', 'VERTEX_AI_JSON_EXISTS');
      
    if (flagError) {
      throw new Error(`Failed to clear JSON flag: ${flagError.message}`);
    }
    
    // Clear the JSON credentials
    const { error: jsonError } = await supabase
      .from('api_keys')
      .update({ 
        key_value: '',
        updated_at: new Date().toISOString()
      })
      .eq('key_name', 'VERTEX_AI_JSON_CREDENTIALS');
      
    if (jsonError) {
      throw new Error(`Failed to clear JSON credentials: ${jsonError.message}`);
    }
    
    // Clear the file name
    const { error: fileNameError } = await supabase
      .from('api_keys')
      .update({ 
        key_value: '',
        updated_at: new Date().toISOString()
      })
      .eq('key_name', 'VERTEX_AI_JSON_FILENAME');
      
    if (fileNameError) {
      throw new Error(`Failed to clear JSON file name: ${fileNameError.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in clear-vertex-json:', error);
    
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
