
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserAppBuilds, 
  createAppBuild, 
  getAppBuildById, 
  triggerAppBuild 
} from '@/lib/buildService';
import { AppBuild } from '@/types/supabase';

// Import our new components
import PromptInput from '@/components/builder/PromptInput';
import BuildProgress from '@/components/builder/BuildProgress';
import BuildPreview from '@/components/builder/BuildPreview';
import BuildHistoryList from '@/components/builder/BuildHistoryList';

const Builder = () => {
  // State variables
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [spec, setSpec] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [appBuilds, setAppBuilds] = useState<AppBuild[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<AppBuild | null>(null);
  const [isShowingHistory, setIsShowingHistory] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  
  // Steps for the build process
  const steps = [
    'Analyzing prompt...',
    'Generating app specification...',
    'Building application code...',
    'Packaging application...',
    'Deploying preview...',
    'Complete!'
  ];
  
  // Fetch build history when user is available
  const fetchBuildHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoadingHistory(true);
      const { data } = await getUserAppBuilds(user.id);
      
      if (data) {
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
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchBuildHistory();
    }
  }, [user]);
  
  // Handle app build submission
  const handleSubmit = async (prompt: string) => {
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
      const appName = generateAppName(prompt);
      
      const { data: buildData } = await createAppBuild(prompt, appName, user.id);
      
      if (!buildData) {
        throw new Error('Failed to create build record');
      }
      
      const { data: buildResult, error: buildError } = await triggerAppBuild(buildData.id, prompt, user.id);
      
      if (buildError) {
        throw buildError;
      }
      
      toast.info('Build process started. This may take a few minutes.');
      
      const checkBuildStatus = async () => {
        const { data: updatedBuild } = await getAppBuildById(buildData.id);
        
        if (!updatedBuild) return;
        
        if (updatedBuild.build_log && updatedBuild.build_log.length > 0) {
          const completedSteps = updatedBuild.build_log.filter(step => step.status === 'success').length;
          setCurrentStep(Math.min(completedSteps, 5));
        }
        
        if (updatedBuild.spec) {
          setSpec(updatedBuild.spec);
        }
        
        if (updatedBuild.code) {
          setCode(updatedBuild.code);
        }
        
        if (updatedBuild.status === 'complete') {
          setIsComplete(true);
          setIsProcessing(false);
          
          const completedBuild: AppBuild = {
            id: updatedBuild.id,
            prompt: updatedBuild.prompt,
            status: 'complete',
            timestamp: updatedBuild.timestamp,
            previewUrl: updatedBuild.preview_url,
            appName: updatedBuild.app_name
          };
          
          setAppBuilds(prev => [completedBuild, ...prev]);
          setSelectedBuild(completedBuild);
          
          toast.success('App successfully built!');
          clearInterval(statusInterval);
        } else if (updatedBuild.status === 'failed') {
          setIsProcessing(false);
          toast.error('App build failed. Please try again.');
          clearInterval(statusInterval);
        }
      };
      
      const statusInterval = setInterval(checkBuildStatus, 5000);
      
      await checkBuildStatus();
      
      setTimeout(() => {
        clearInterval(statusInterval);
        if (isProcessing) {
          setIsProcessing(false);
          toast.error('Build process is taking longer than expected. Please check the build status later.');
        }
      }, 5 * 60 * 1000);
      
      fetchBuildHistory();
    } catch (error) {
      console.error('Error building app:', error);
      uiToast({
        title: "Error",
        description: "Failed to build app. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };
  
  // Handle viewing a build from history
  const handleViewBuild = (build: AppBuild) => {
    setSelectedBuild(build);
  };
  
  // Generate an app name from the prompt
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
              <BuildHistoryList 
                builds={appBuilds} 
                onViewBuild={handleViewBuild}
                isLoading={isLoadingHistory}
              />
            </CardContent>
          </Card>
        )}
        
        <PromptInput 
          isProcessing={isProcessing}
          currentStep={currentStep}
          steps={steps}
          onSubmit={handleSubmit}
        />
        
        {isProcessing && (
          <Card className="p-4">
            <BuildProgress 
              isProcessing={isProcessing}
              currentStep={currentStep}
              totalSteps={steps.length}
              steps={steps}
            />
          </Card>
        )}
        
        <BuildPreview 
          spec={spec}
          code={code}
          isComplete={isComplete}
          selectedBuild={selectedBuild}
        />
      </div>
    </>
  );
};

export default Builder;
