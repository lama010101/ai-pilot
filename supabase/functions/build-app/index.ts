
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { buildId, prompt, userId } = await req.json()
    
    // Validate inputs
    if (!buildId || !prompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Start the build process
    const buildLog = [
      { step: 'analyze_prompt', status: 'success', message: 'Prompt analyzed successfully', timestamp: new Date().toISOString() },
      { step: 'generate_spec', status: 'pending', message: 'Generating app specification...', timestamp: new Date().toISOString() }
    ]
    
    // Update the build record to indicate processing has started
    const { error: updateError } = await supabase
      .from('app_builds')
      .update({ build_log: buildLog })
      .eq('id', buildId)
    
    if (updateError) {
      console.error('Error updating build log:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // This would normally be a longer process, but for demo purposes we'll update it quickly
    // In a real implementation, this would be a more complex process with multiple steps
    setTimeout(async () => {
      try {
        const buildLogComplete = [
          { step: 'analyze_prompt', status: 'success', message: 'Prompt analyzed successfully', timestamp: new Date().toISOString() },
          { step: 'generate_spec', status: 'success', message: 'App specification generated', timestamp: new Date().toISOString() },
          { step: 'build_app', status: 'success', message: 'Application code built', timestamp: new Date().toISOString() },
          { step: 'package_app', status: 'success', message: 'Application packaged', timestamp: new Date().toISOString() },
          { step: 'deploy_preview', status: 'success', message: 'Preview deployed', timestamp: new Date().toISOString() },
        ]
        
        // Generate sample app spec and code
        const spec = generateSampleSpec(prompt)
        const code = generateSampleCode(prompt)
        const previewUrl = 'https://example.com/preview/' + buildId

        // Update the build with completion status
        await supabase
          .from('app_builds')
          .update({
            status: 'complete',
            build_log: buildLogComplete,
            spec,
            code,
            preview_url: previewUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', buildId)
          
        console.log('Build completed successfully')
      } catch (error) {
        console.error('Error in async build process:', error)
        // Update the build with error status
        await supabase
          .from('app_builds')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', buildId)
      }
    }, 15000) // Simulate a 15-second build process
    
    return new Response(
      JSON.stringify({ message: 'Build process started' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to generate a sample app specification
function generateSampleSpec(prompt: string): string {
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
\`\`\``
}

// Helper function to generate sample code
function generateSampleCode(prompt: string): string {
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
}`
}
