
import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  History,
  Eye,
  Table
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { createAgentTask } from '@/lib/supabase/taskService';
import { getAgentById } from '@/lib/supabase/agentService';
import { createAppSpec } from '@/lib/supabase/appSpecService';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { getUserAppBuilds, createAppBuild, updateAppBuild } from '@/lib/buildService';
import { AppBuildDB } from '@/types/supabase';

// Type for app builds history
interface AppBuild {
  id: string;
  prompt: string;
  status: 'processing' | 'complete' | 'failed';
  timestamp: string;
  previewUrl?: string;
  appName: string;
}

const Builder = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [spec, setSpec] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [appBuilds, setAppBuilds] = useState<AppBuild[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<AppBuild | null>(null);
  const [isShowingHistory, setIsShowingHistory] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  
  const steps = [
    'Analyzing prompt...',
    'Generating app specification...',
    'Building application code...',
    'Packaging application...',
    'Deploying preview...',
    'Complete!'
  ];
  
  // Function to fetch build history from Supabase
  const fetchBuildHistory = async () => {
    if (!user) return;
    
    try {
      const { data } = await getUserAppBuilds(user.id);
      
      if (data) {
        // Map DB objects to AppBuild interface
        const builds: AppBuild[] = data.map(build => ({
          id: build.id,
          prompt: build.prompt,
          status: build.status as 'processing' | 'complete' | 'failed',
          timestamp: build.timestamp,
          previewUrl: build.preview_url,
          appName: build.app_name
        }));
        
        setAppBuilds(builds);
      }
    } catch (error) {
      console.error('Error fetching build history:', error);
    }
  };
  
  // Load build history on component mount
  useEffect(() => {
    if (user) {
      fetchBuildHistory();
    }
  }, [user]);
  
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to build an app');
      return;
    }
    
    if (!user) {
      toast.error('You need to be logged in to build an app');
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
      
      // Generate app name based on prompt
      const appName = generateAppName(prompt);
      
      // Create a new app build record
      const { data: buildData } = await createAppBuild(prompt, appName, user.id);
      
      if (!buildData) {
        throw new Error('Failed to create build record');
      }
      
      // Simulate delay for analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep(1);
      
      // Create a task for the writer
      if (writer) {
        const specTask = await createAgentTask({
          agent_id: writer.id,
          command: `Generate app specification for: ${prompt}`,
          result: '',
          confidence: 0.9,
          status: 'processing'
        });
      }
      
      // Simulate spec generation with a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate a spec based on the prompt
      const generatedSpec = generateSpec(prompt);
      setSpec(generatedSpec);
      setCurrentStep(2);
      
      // Update the build with the spec
      await updateAppBuild(buildData.id, { 
        spec: generatedSpec,
        status: 'processing',
      });
      
      // Create app spec in the database
      await createAppSpec({
        name: appName,
        description: prompt,
        status: 'draft',
        content: generatedSpec,
        author_id: user.id
      });
      
      // Step 3: Generate code
      toast.info('Starting code generation');
      
      // Simulate code generation with a delay
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Generate code based on the spec
      const generatedCode = generateCode(generatedSpec);
      setCode(generatedCode);
      setCurrentStep(3);
      
      // Update the build with the code
      await updateAppBuild(buildData.id, { 
        code: generatedCode,
      });
      
      // Step 4: Package the application
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep(4);
      
      // Step 5: Deploy the preview
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentStep(5);
      
      // Update the build record with complete status and preview URL
      const previewUrl = `https://zap-demo-${buildData.id}.vercel.app`;
      await updateAppBuild(buildData.id, {
        status: 'complete',
        preview_url: previewUrl,
        updated_at: new Date().toISOString(),
        build_log: [
          { step: "analyze", status: "success", timestamp: new Date().toISOString() },
          { step: "generate_spec", status: "success", timestamp: new Date().toISOString() },
          { step: "generate_code", status: "success", timestamp: new Date().toISOString() },
          { step: "deploy_preview", status: "success", timestamp: new Date().toISOString() }
        ]
      });
      
      // Add to local state
      const completedBuild: AppBuild = {
        id: buildData.id,
        prompt: prompt,
        status: 'complete',
        timestamp: buildData.timestamp,
        previewUrl: previewUrl,
        appName: appName
      };
      
      setAppBuilds(prev => [completedBuild, ...prev]);
      setSelectedBuild(completedBuild);
      setIsComplete(true);
      
      toast.success('App successfully built!');
      
      // Refresh build history
      fetchBuildHistory();
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
  
  const handleViewPreview = (build: AppBuild) => {
    setSelectedBuild(build);
    // In a real implementation, this would load an actual preview
    if (iframeRef.current && build.previewUrl) {
      // For demo purposes, we're not actually loading the URL since it doesn't exist
      // iframeRef.current.src = build.previewUrl;
    }
  };
  
  const handleDeploy = () => {
    toast.info('Deployment in progress! Your app will be available shortly.');
    
    // Simulate deployment process
    setTimeout(() => {
      toast.success('App deployed successfully! You can access it at the production URL.');
    }, 3000);
  };
  
  // Helper function to generate an app name from the prompt
  const generateAppName = (prompt: string): string => {
    const words = prompt.split(' ');
    const nameWords = words.filter(word => 
      word.length > 3 && 
      !['build', 'create', 'make', 'with', 'that', 'app', 'application'].includes(word.toLowerCase())
    ).slice(0, 2);
    
    if (nameWords.length === 0) {
      return 'ZapApp-' + Math.floor(Math.random() * 1000);
    }
    
    return nameWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') + 'App';
  };
  
  // Helper function to generate a spec from the prompt
  const generateSpec = (prompt: string): string => {
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
  };
  
  // Helper function to generate code from the spec
  const generateCode = (spec: string): string => {
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
  };
  
  return (
    <>
      <Helmet>
        <title>App Builder | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI App Builder</h1>
            <p className="text-muted-foreground">
              Generate complete applications from natural language prompts
            </p>
          </div>
          
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsShowingHistory(!isShowingHistory)}
          >
            <History className="h-4 w-4" />
            {isShowingHistory ? 'Hide History' : 'Show History'}
          </Button>
        </div>
        
        {isShowingHistory && (
          <Card>
            <CardHeader>
              <CardTitle>Build History</CardTitle>
              <CardDescription>
                Your previous app builds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appBuilds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No build history yet. Create your first app!
                </div>
              ) : (
                <div className="space-y-4">
                  {appBuilds.map((build) => (
                    <div 
                      key={build.id} 
                      className="border rounded-md p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleViewPreview(build)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{build.appName}</h3>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {build.prompt}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-md ${
                            build.status === 'complete' ? 'bg-green-100 text-green-800' : 
                            build.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {build.status.charAt(0).toUpperCase() + build.status.slice(1)}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(build.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
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
        
        {(spec || code || isComplete || selectedBuild) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedBuild ? selectedBuild.appName : 'Build Results'}
              </CardTitle>
              <CardDescription>
                {selectedBuild 
                  ? `App generated from prompt: ${selectedBuild.prompt.substring(0, 100)}${selectedBuild.prompt.length > 100 ? '...' : ''}`
                  : 'App generated from your prompt'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="spec" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="spec" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Specification
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> Code Preview
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> App Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="spec" className="mt-4">
                  <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px]">
                    <pre className="whitespace-pre-wrap text-sm">{spec || "Specification will appear here after building."}</pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="mt-4">
                  <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px]">
                    <pre className="whitespace-pre-wrap text-sm">{code || "Code will appear here after building."}</pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="bg-card-foreground/5 rounded-md p-4 h-[400px] flex items-center justify-center">
                    {selectedBuild?.previewUrl ? (
                      <div className="w-full h-full border border-border rounded">
                        <iframe 
                          ref={iframeRef}
                          className="w-full h-full"
                          title="App Preview"
                          src="about:blank"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Table className="h-12 w-12 mb-2 mx-auto opacity-50" />
                        <p>Preview will be available after build completes.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            {(isComplete || selectedBuild?.status === 'complete') && (
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
