
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BuildAppRequest {
  buildId: string;
  prompt: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Extract the request body
    const requestData: BuildAppRequest = await req.json()
    const { buildId, prompt, userId } = requestData
    
    console.log(`Processing build request for build ${buildId}`)
    
    // Step 1: Generate a spec
    console.log('Generating app specification...')
    const spec = generateMockSpec(prompt)
    
    // Update the build with the spec
    await supabaseClient
      .from('app_builds')
      .update({ 
        spec,
        status: 'processing',
        updated_at: new Date().toISOString(),
        build_log: [
          { step: "generate_spec", status: "success", timestamp: new Date().toISOString() }
        ]
      })
      .eq('id', buildId)
    
    // Step 2: Generate app code
    console.log('Generating app code...')
    const code = generateMockCode(spec)
    
    // Update the build with the code
    await supabaseClient
      .from('app_builds')
      .update({ 
        code,
        updated_at: new Date().toISOString(),
        build_log: [
          { step: "generate_spec", status: "success", timestamp: new Date().toISOString() },
          { step: "generate_code", status: "success", timestamp: new Date().toISOString() }
        ]
      })
      .eq('id', buildId)
    
    // Step 3: Generate a preview URL
    console.log('Generating app preview...')
    const previewUrl = `https://zap-demo-${buildId}.vercel.app`
    
    // Complete the build
    await supabaseClient
      .from('app_builds')
      .update({ 
        status: 'complete',
        preview_url: previewUrl,
        updated_at: new Date().toISOString(),
        build_log: [
          { step: "generate_spec", status: "success", timestamp: new Date().toISOString() },
          { step: "generate_code", status: "success", timestamp: new Date().toISOString() },
          { step: "deploy_preview", status: "success", timestamp: new Date().toISOString() }
        ],
        budget_usage: 0.05 // Mock budget usage
      })
      .eq('id', buildId)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        buildId,
        previewUrl
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  } catch (error) {
    console.error('Error processing build:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  }
})

// Mock function to generate app specification
function generateMockSpec(prompt: string): string {
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

// Mock function to generate app code
function generateMockCode(spec: string): string {
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

export default App;`
}
