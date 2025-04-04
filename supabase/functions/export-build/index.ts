
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import JSZip from "https://esm.sh/jszip@3.10.1";

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

    console.log(`Exporting build ${buildId} for user ${userId}`);
    
    // Get the build data
    const { data: build, error: buildError } = await supabase
      .from('app_builds')
      .select('*')
      .eq('id', buildId)
      .single();
    
    if (buildError || !build) {
      throw new Error(`Failed to fetch build: ${buildError?.message || 'Build not found'}`);
    }
    
    // Security check: ensure only the build owner can export
    if (build.user_id !== userId) {
      throw new Error('Unauthorized: You can only export your own builds');
    }
    
    // Verify the build is complete
    if (build.status !== 'complete') {
      throw new Error('Cannot export incomplete build');
    }
    
    // Create a ZIP file with the build data
    const zip = new JSZip();
    
    // Add the app specification
    if (build.spec) {
      zip.file("app-specification.json", build.spec);
    }
    
    // Add the generated code
    if (build.code) {
      zip.file("generated-code.js", build.code);
    }
    
    // Add a README.md file
    zip.file("README.md", `# ${build.app_name}\n\nGenerated from prompt: "${build.prompt}"\n\nBuild ID: ${build.id}\nCreated: ${build.timestamp}\n`);
    
    // Generate the ZIP file
    const zipContent = await zip.generateAsync({ type: "uint8array" });
    
    // Create a storage bucket for exports if it doesn't exist
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    const exportsBucketExists = bucketData?.some(bucket => bucket.name === 'exports');
    
    if (!exportsBucketExists) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('exports', { public: false });
        
      if (createBucketError) {
        throw new Error(`Failed to create exports bucket: ${createBucketError.message}`);
      }
    }
    
    // Upload the ZIP file to Supabase Storage
    const filePath = `${buildId}/${build.app_name.replace(/\s+/g, '-').toLowerCase()}-export.zip`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('exports')
      .upload(filePath, zipContent, {
        contentType: 'application/zip',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Failed to upload export: ${uploadError.message}`);
    }
    
    // Generate a signed URL for the ZIP file
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('exports')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
      
    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to generate signed URL: ${signedUrlError?.message || 'Unknown error'}`);
    }
    
    // Update the build record with the export URL
    const { error: updateError } = await supabase
      .from('app_builds')
      .update({ 
        export_url: signedUrlData.signedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', buildId);
      
    if (updateError) {
      console.error(`Failed to update build with export URL: ${updateError.message}`);
      // Continue anyway
    }
    
    // Return the signed URL
    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signedUrlData.signedUrl,
        fileName: `${build.app_name.replace(/\s+/g, '-').toLowerCase()}-export.zip`
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (err) {
    console.error('Error in export-build function:', err.message);
    
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
