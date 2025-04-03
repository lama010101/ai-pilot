
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  PlayCircle, 
  Code2, 
  FileText, 
  Rocket,
  Loader2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { createAgentTask } from '@/lib/supabase/taskService';
import { getAgentById } from '@/lib/supabase/agentService';
import { toast } from "sonner";

const Builder = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [spec, setSpec] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const { toast: uiToast } = useToast();
  
  const steps = [
    'Analyzing prompt...',
    'Generating app specification...',
    'Building application code...',
    'Packaging application...',
    'Complete!'
  ];
  
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to build an app');
      return;
    }
    
    setIsProcessing(true);
    setCurrentStep(0);
    setSpec('');
    setCode('');
    setIsComplete(false);
    
    try {
      // Step 1: Get the writer agent
      const { data: writer } = await getAgentById('zapwriter');
      
      if (!writer) {
        throw new Error('Writer agent not found');
      }
      
      // Step 2: Create spec writing task
      toast.info('Starting app specification generation');
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep(1);
      
      // Create a task for the writer
      const specTask = await createAgentTask({
        agent_id: writer.id,
        command: `Generate app specification for: ${prompt}`,
        result: '',
        confidence: 0.9,
        status: 'processing'
      });
      
      // Simulate spec generation with a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Example generated spec
      const generatedSpec = `# App Specification for: ${prompt}\n
## Overview
This application will provide users with the following features:
- User authentication with email/password
- Create, read, update, and delete items
- Categorize items with tags
- Filter and search functionality
- Responsive design for mobile and desktop

## Technical Requirements
- Frontend: React with Tailwind CSS
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
      
      setSpec(generatedSpec);
      setCurrentStep(2);
      
      // Step 3: Generate code
      toast.info('Starting code generation');
      
      // Simulate code generation with a delay
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Example generated code
      const generatedCode = `// App.tsx
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
      
      setCode(generatedCode);
      setCurrentStep(3);
      
      // Step 4: Complete the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep(4);
      setIsComplete(true);
      
      toast.success('App successfully built!');
    } catch (error) {
      console.error('Error building app:', error);
      uiToast({
        title: "Error",
        description: "Failed to build app. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeploy = () => {
    toast.info('Deployment feature coming soon!');
  };
  
  return (
    <>
      <Helmet>
        <title>App Builder | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI App Builder</h1>
          <p className="text-muted-foreground">
            Generate complete applications from natural language prompts
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New App</CardTitle>
            <CardDescription>
              Describe the app you want to build in plain English
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Build a to-do app with tasks and tags, dark mode support, and user authentication"
              className="min-h-[120px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {isProcessing && (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>{steps[currentStep]}</span>
                </div>
              )}
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={isProcessing || !prompt.trim()}
              className="flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {isProcessing ? 'Building...' : 'Build App'}
            </Button>
          </CardFooter>
        </Card>
        
        {(spec || code || isComplete) && (
          <Card>
            <CardHeader>
              <CardTitle>Build Results</CardTitle>
              <CardDescription>
                App generated from your prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="spec" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="spec" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Specification
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> Code Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="spec" className="mt-4">
                  <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px]">
                    <pre className="whitespace-pre-wrap text-sm">{spec}</pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="mt-4">
                  <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px]">
                    <pre className="whitespace-pre-wrap text-sm">{code}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            {isComplete && (
              <CardFooter>
                <Button 
                  onClick={handleDeploy}
                  className="flex items-center gap-2 ml-auto"
                  variant="default"
                >
                  <Rocket className="h-4 w-4" />
                  Deploy App
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </>
  );
};

export default Builder;
