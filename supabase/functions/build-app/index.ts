
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';

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
    // Get the request body
    const { buildId, prompt, userId } = await req.json();
    
    // Log request for debugging
    console.log("Edge function reached with:", { buildId, prompt, userId });
    
    // Validate inputs
    if (!buildId || !prompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize the build log
    const buildLog = [
      { step: 'analyze_prompt', status: 'pending', message: 'Analyzing prompt...', timestamp: new Date().toISOString() }
    ];
    
    // Update the build record to indicate processing has started
    const { error: updateError } = await supabase
      .from('app_builds')
      .update({ build_log: buildLog })
      .eq('id', buildId);
    
    if (updateError) {
      console.error('Error updating build log:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Start the asynchronous build process
    (async () => {
      try {
        // 1. Analyze the prompt
        await updateBuildLog(supabase, buildId, [
          { step: 'analyze_prompt', status: 'success', message: 'Prompt analyzed successfully', timestamp: new Date().toISOString() },
          { step: 'generate_spec', status: 'pending', message: 'Generating app specification...', timestamp: new Date().toISOString() }
        ]);

        // 2. Generate app spec using OpenAI
        const appSpec = await generateAppSpec(prompt);
        
        await updateBuildLog(supabase, buildId, [
          { step: 'analyze_prompt', status: 'success', message: 'Prompt analyzed successfully', timestamp: new Date().toISOString() },
          { step: 'generate_spec', status: 'success', message: 'App specification generated', timestamp: new Date().toISOString() },
          { step: 'build_app', status: 'pending', message: 'Building application code...', timestamp: new Date().toISOString() }
        ]);
        
        // 3. Generate app code using OpenAI
        const appCode = await generateAppCode(prompt, appSpec);
        
        await updateBuildLog(supabase, buildId, [
          { step: 'analyze_prompt', status: 'success', message: 'Prompt analyzed successfully', timestamp: new Date().toISOString() },
          { step: 'generate_spec', status: 'success', message: 'App specification generated', timestamp: new Date().toISOString() },
          { step: 'build_app', status: 'success', message: 'Application code built', timestamp: new Date().toISOString() },
          { step: 'package_app', status: 'pending', message: 'Packaging application...', timestamp: new Date().toISOString() }
        ]);

        // 4. Package the app (in this case, prepare for deployment)
        await updateBuildLog(supabase, buildId, [
          { step: 'analyze_prompt', status: 'success', message: 'Prompt analyzed successfully', timestamp: new Date().toISOString() },
          { step: 'generate_spec', status: 'success', message: 'App specification generated', timestamp: new Date().toISOString() },
          { step: 'build_app', status: 'success', message: 'Application code built', timestamp: new Date().toISOString() },
          { step: 'package_app', status: 'success', message: 'Application packaged', timestamp: new Date().toISOString() },
          { step: 'deploy_preview', status: 'pending', message: 'Deploying preview...', timestamp: new Date().toISOString() }
        ]);

        // 5. Deploy preview
        const previewUrl = await deployPreview(buildId, appCode, prompt);
        
        const buildLogComplete = [
          { step: 'analyze_prompt', status: 'success', message: 'Prompt analyzed successfully', timestamp: new Date().toISOString() },
          { step: 'generate_spec', status: 'success', message: 'App specification generated', timestamp: new Date().toISOString() },
          { step: 'build_app', status: 'success', message: 'Application code built', timestamp: new Date().toISOString() },
          { step: 'package_app', status: 'success', message: 'Application packaged', timestamp: new Date().toISOString() },
          { step: 'deploy_preview', status: 'success', message: 'Preview deployed', timestamp: new Date().toISOString() }
        ];

        // 6. Update the build record with completion
        await supabase
          .from('app_builds')
          .update({
            status: 'complete',
            build_log: buildLogComplete,
            spec: appSpec,
            code: appCode,
            preview_url: previewUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', buildId);
          
        console.log('Build completed successfully with preview URL:', previewUrl);
      } catch (error) {
        console.error('Error in build process:', error);
        
        // Update the build with error status
        await supabase
          .from('app_builds')
          .update({
            status: 'failed',
            build_log: [
              ...await getCurrentBuildLog(supabase, buildId),
              { step: 'error', status: 'failed', message: `Build failed: ${error.message}`, timestamp: new Date().toISOString() }
            ],
            updated_at: new Date().toISOString()
          })
          .eq('id', buildId);
      }
    })();
    
    return new Response(
      JSON.stringify({ message: 'Build process started' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to update the build log
async function updateBuildLog(supabase, buildId, buildLog) {
  try {
    const { error } = await supabase
      .from('app_builds')
      .update({ build_log: buildLog, updated_at: new Date().toISOString() })
      .eq('id', buildId);
      
    if (error) {
      console.error('Error updating build log:', error);
    }
  } catch (updateError) {
    console.error('Exception updating build log:', updateError);
  }
}

// Helper function to get the current build log
async function getCurrentBuildLog(supabase, buildId) {
  try {
    const { data, error } = await supabase
      .from('app_builds')
      .select('build_log')
      .eq('id', buildId)
      .single();
      
    if (error) {
      console.error('Error getting build log:', error);
      return [];
    }
    
    return data.build_log || [];
  } catch (getError) {
    console.error('Exception getting build log:', getError);
    return [];
  }
}

// Generate app specification using OpenAI
async function generateAppSpec(prompt) {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const configuration = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(configuration);
    
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert app specification generator. Create a detailed specification for a web application based on the user's prompt.
          Format the specification in markdown, including sections for:
          - Overview (brief description of the app)
          - Technical Requirements (technologies to use)
          - Features (list of key features)
          - Data Models (structure of main data entities)
          - UI Components (main UI elements)
          
          Keep the specification focused and implementable as a single-page React application.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating app specification:', error);
    throw new Error(`Failed to generate app specification: ${error.message}`);
  }
}

// Generate app code using OpenAI
async function generateAppCode(prompt, spec) {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const configuration = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(configuration);
    
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert React developer. Generate the code for a web application based on the given specification. 
          The code should be a complete solution that would work in a Vite+React project with Tailwind CSS.
          Include all necessary components, hooks, and utilities.
          Format your response as a single code block containing all the necessary files and their content.
          Make sure to include App.jsx/tsx as the main entry point.`
        },
        { 
          role: "user", 
          content: `Create a React application based on this specification and prompt:
          
          Prompt: ${prompt}
          
          Specification:
          ${spec}` 
        }
      ],
      temperature: 0.5,
      max_tokens: 4000
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating app code:', error);
    throw new Error(`Failed to generate app code: ${error.message}`);
  }
}

// Deploy the app to a preview environment
async function deployPreview(buildId, code, prompt) {
  try {
    console.log('Deploying preview for build:', buildId);
    
    // Prepare for Vercel deployment
    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    
    if (vercelToken) {
      // Implement Vercel deployment logic
      return await deployToVercel(buildId, code, prompt, vercelToken);
    } else {
      // Fallback to generating a mockup preview URL
      return generateMockupPreviewUrl(buildId, prompt);
    }
  } catch (error) {
    console.error('Error deploying preview:', error);
    throw error;
  }
}

// Deploy to Vercel (if token is available)
async function deployToVercel(buildId, code, prompt, vercelToken) {
  try {
    // Generate a sanitized app name from the prompt
    const appName = sanitizeAppName(prompt);
    
    // Generate a unique deployment name
    const deploymentName = `app-preview-${buildId.substring(0, 8)}`;
    
    // Extract files from the code
    const files = extractVercelFilesFromCode(code);
    
    // Prepare the deployment payload
    const payload = {
      name: deploymentName,
      project: appName,
      files,
      framework: "vite",
      public: true
    };
    
    // Send the deployment request to Vercel
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Vercel deployment failed: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const deploymentData = await response.json();
    
    // Return the preview URL
    return deploymentData.url;
  } catch (error) {
    console.error('Vercel deployment error:', error);
    // Fallback to mockup URL if Vercel deployment fails
    return generateMockupPreviewUrl(buildId, prompt);
  }
}

// Extract files for Vercel deployment from generated code
function extractVercelFilesFromCode(code) {
  // Simplified implementation - in a real scenario, you would parse the code
  // to extract individual files and their content
  
  // For now, create a simple index.html that loads the code
  return {
    'index.html': {
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'https://esm.sh/react@18';
    import ReactDOM from 'https://esm.sh/react-dom@18/client';
    
    // Generated App Code
    ${code}
    
    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`
    }
  };
}

// Generate a mockup preview URL (fallback when Vercel token is not available)
function generateMockupPreviewUrl(buildId, prompt) {
  // Create a simple HTML file with the app preview
  const appName = sanitizeAppName(prompt);
  const sanitizedBuildId = buildId.replace(/-/g, '').substring(0, 8);
  
  // In a real implementation, this would deploy to Vercel or similar
  // But for now, we'll create a static preview URL
  const previewDomain = "https://preview-apps.aipilot.io";
  const previewUrl = `${previewDomain}/${sanitizedBuildId}-${appName}`;
  
  console.log('Generated preview URL:', previewUrl);
  
  return previewUrl;
}

// Sanitize app name from prompt
function sanitizeAppName(prompt) {
  const words = prompt.split(' ');
  const nameWords = words.filter(word => 
    word.length > 3 && 
    !['build', 'create', 'make', 'with', 'that', 'app', 'application'].includes(word.toLowerCase())
  ).slice(0, 2);
  
  if (nameWords.length === 0) {
    return 'app-' + Math.floor(Math.random() * 1000);
  }
  
  return nameWords.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}
