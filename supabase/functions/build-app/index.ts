
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client with the Auth context of the logged in user
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  // Create clients with Auth context of the logged in user & the service role
  const authHeader = req.headers.get("Authorization");
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader || "" } },
  });
  
  // Service role client for administrative tasks
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the user from the auth context
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "You must be logged in to use this endpoint" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body
    const { prompt, appName } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate estimated budget usage - in a real app this would be based on model and complexity
    const estimatedBudgetUsage = 0.25; // Using a fixed value for this example

    // Create a new build record
    const { data: buildData, error: buildError } = await userClient
      .from("app_builds")
      .insert({
        user_id: user.id,
        prompt,
        app_name: appName || generateAppName(prompt),
        status: "processing",
        budget_usage: estimatedBudgetUsage,
      })
      .select()
      .single();

    if (buildError) {
      console.error("Error creating build record:", buildError);
      return new Response(
        JSON.stringify({ error: "Database Error", message: "Failed to create build record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In a real implementation, we would:
    // 1. Call an AI service to generate the specification
    // 2. Call another AI service to generate the code
    // 3. Deploy to a sandbox environment
    // 4. Return the result

    // For this MVP, we'll simulate the process
    const spec = generateSpec(prompt);
    const code = generateCode(spec);
    const previewUrl = `https://zap-demo-${buildData.id}.vercel.app`;

    // Update the build with the generated content
    setTimeout(async () => {
      try {
        await serviceClient
          .from("app_builds")
          .update({
            status: "complete",
            spec,
            code,
            preview_url: previewUrl,
            build_log: JSON.stringify([
              { step: "analyze", status: "success", timestamp: new Date().toISOString() },
              { step: "generate_spec", status: "success", timestamp: new Date().toISOString() },
              { step: "generate_code", status: "success", timestamp: new Date().toISOString() },
              { step: "deploy_preview", status: "success", timestamp: new Date().toISOString() },
            ]),
            updated_at: new Date().toISOString(),
          })
          .eq("id", buildData.id);

        // Create a generated app record
        await serviceClient
          .from("generated_apps")
          .insert({
            build_id: buildData.id,
            name: buildData.app_name,
            description: prompt,
            status: "deployed",
            deployment_url: previewUrl,
          });
      } catch (updateError) {
        console.error("Error updating build:", updateError);
      }
    }, 10000); // Simulate a 10-second build process

    return new Response(
      JSON.stringify({
        message: "Build started successfully",
        buildId: buildData.id,
        estimatedCompletionTime: "10 seconds",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in build-app function:", error);
    return new Response(
      JSON.stringify({ error: "Server Error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to generate an app name from the prompt
function generateAppName(prompt: string): string {
  const words = prompt.split(" ");
  const nameWords = words
    .filter(
      (word) =>
        word.length > 3 &&
        ![
          "build",
          "create",
          "make",
          "with",
          "that",
          "app",
          "application",
        ].includes(word.toLowerCase())
    )
    .slice(0, 2);

  if (nameWords.length === 0) {
    return "ZapApp-" + Math.floor(Math.random() * 1000);
  }

  return (
    nameWords
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "App"
  );
}

// Helper function to generate a spec from the prompt
function generateSpec(prompt: string): string {
  // In a real implementation, this would use an LLM
  return `# App Specification for: ${prompt}\n
## Overview
This application will provide users with the following features:
- User authentication with email/password
- Create, read, update, and delete items
- Categorize items with tags
- Filter and search functionality
- Responsive design for mobile and desktop

## Technical Requirements
- Frontend: Next.js with Tailwind CSS
- Backend: Supabase for authentication and database
- State Management: React Query
- UI Components: shadcn/ui

## Pages
1. Login/Register
2. Dashboard
3. Item Detail
4. Settings

## Data Models
\`\`\`
items {
  id: uuid
  user_id: uuid
  title: string
  description: string
  created_at: timestamp
  updated_at: timestamp
}

tags {
  id: uuid
  name: string
}

item_tags {
  item_id: uuid
  tag_id: uuid
}
\`\`\``;
}

// Helper function to generate code from the spec
function generateCode(spec: string): string {
  // In a real implementation, this would use an LLM
  return `// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ItemDetail from './pages/ItemDetail';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/items/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;`;
}
