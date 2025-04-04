
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the build ID from the request
    const { buildId, userId } = await req.json();
    
    if (!buildId) {
      throw new Error('Build ID is required');
    }

    console.log(`Deploying preview for build ${buildId} for user ${userId}`);
    
    // Get the build data
    const { data: build, error: buildError } = await supabase
      .from('app_builds')
      .select('*')
      .eq('id', buildId)
      .single();
    
    if (buildError || !build) {
      throw new Error(`Failed to fetch build: ${buildError?.message || 'Build not found'}`);
    }
    
    // Security check: ensure only the build owner can deploy
    if (build.user_id !== userId) {
      throw new Error('Unauthorized: You can only deploy your own builds');
    }
    
    // Verify the build is complete
    if (build.status !== 'complete') {
      throw new Error('Cannot deploy incomplete build');
    }
    
    // In a real implementation, you would call a CI/CD service API here
    // For this demo, we'll simulate a deployment by setting a preview URL
    const previewUrl = `https://app-preview-${build.id.substring(0, 8)}.example.com`;
    
    // Update the build record with the preview URL
    const { error: updateError } = await supabase
      .from('app_builds')
      .update({ 
        preview_url: previewUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', buildId);
      
    if (updateError) {
      throw new Error(`Failed to update build with preview URL: ${updateError.message}`);
    }
    
    // Return the preview URL
    return new Response(
      JSON.stringify({
        success: true,
        previewUrl: previewUrl
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (err) {
    console.error('Error in preview-build function:', err.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
