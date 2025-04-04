
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  createAppBuild, 
  getAppBuildById, 
  triggerAppBuild 
} from '@/lib/buildService';
import { AppBuild } from '@/types/supabase';

export function useAppBuilder() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [spec, setSpec] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [selectedBuild, setSelectedBuild] = useState<AppBuild | null>(null);
  const [promptInputValue, setPromptInputValue] = useState<string>('');
  const [buildError, setBuildError] = useState<string | null>(null);
  
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Steps for the build process
  const steps = [
    'Analyzing prompt...',
    'Generating app specification...',
    'Building application code...',
    'Packaging application...',
    'Deploying preview...',
    'Complete!'
  ];

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

  // Handle app build submission
  const handleSubmit = async (prompt: string) => {
    // Reset error state
    setBuildError(null);
    
    // Validate prompt
    if (!prompt || prompt.trim() === '') {
      toast.error('Please enter a description of the app you want to build');
      return;
    }
    
    // Check user authentication
    if (!user) {
      toast.error('You need to be logged in to build an app');
      return;
    }
    
    // Set initial states
    setIsProcessing(true);
    setCurrentStep(0);
    setSpec('');
    setCode('');
    setIsComplete(false);
    
    let statusInterval: number | null = null;
    
    try {
      const appName = generateAppName(prompt);
      
      // Create app build record in database
      const { data: buildData, error: createError } = await createAppBuild(prompt, appName, user.id);
      
      if (createError || !buildData) {
        console.error('Failed to create build record:', createError);
        throw new Error(createError?.message || 'Failed to create build record');
      }
      
      // Trigger the build process
      const { data: buildResult, error: buildError } = await triggerAppBuild(buildData.id, prompt, user.id);
      
      if (buildError) {
        console.error('Failed to trigger build process:', buildError);
        throw buildError;
      }
      
      // Update URL to include the new build ID
      navigate(`/builder?id=${buildData.id}`, { replace: true });
      
      toast.info('Build process started. This may take a few minutes.');
      
      const checkBuildStatus = async () => {
        try {
          const { data: updatedBuild, error: statusError } = await getAppBuildById(buildData.id);
          
          if (statusError) {
            console.error('Error checking build status:', statusError);
            return;
          }
          
          if (!updatedBuild) {
            console.warn('No build data returned when checking status');
            return;
          }
          
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
              exportUrl: updatedBuild.export_url,
              appName: updatedBuild.app_name
            };
            
            setSelectedBuild(completedBuild);
            
            toast.success('App successfully built!');
            if (statusInterval) clearInterval(statusInterval);
            
            return completedBuild;
          } else if (updatedBuild.status === 'failed') {
            setIsProcessing(false);
            setBuildError('App build failed. Please try a different prompt.');
            toast.error('App build failed. Please try again.');
            if (statusInterval) clearInterval(statusInterval);
          }
          
          return null;
        } catch (checkError) {
          console.error('Error in checkBuildStatus:', checkError);
          return null;
        }
      };
      
      statusInterval = window.setInterval(checkBuildStatus, 5000);
      
      await checkBuildStatus();
      
      // Safety timeout to prevent indefinite loading
      setTimeout(() => {
        if (isProcessing) {
          setIsProcessing(false);
          setBuildError('Build process timed out. Please try again later.');
          toast.error('Build process is taking longer than expected. Please check the build status later.');
          if (statusInterval) clearInterval(statusInterval);
        }
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Error building app:', error);
      setIsProcessing(false);
      
      // Determine a user-friendly error message
      let errorMessage = 'Failed to build app. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Build failed: ${error.message}`;
      }
      
      setBuildError(errorMessage);
      
      uiToast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Clear any interval if it exists
      if (statusInterval) clearInterval(statusInterval);
    }
  };

  // Load build data from API
  const loadBuildData = async (buildId: string) => {
    try {
      const { data: buildData, error } = await getAppBuildById(buildId);
      
      if (error) {
        console.error('Error fetching build data:', error);
        toast.error('Failed to load app build data');
        return null;
      }
      
      if (buildData) {
        if (buildData.spec) {
          setSpec(buildData.spec);
        }
        
        if (buildData.code) {
          setCode(buildData.code);
        }
        
        setIsComplete(buildData.status === 'complete');
        
        const build: AppBuild = {
          id: buildData.id,
          prompt: buildData.prompt,
          status: buildData.status as 'processing' | 'complete' | 'failed',
          timestamp: buildData.timestamp,
          previewUrl: buildData.preview_url,
          exportUrl: buildData.export_url,
          appName: buildData.app_name
        };
        
        setSelectedBuild(build);
        
        return build;
      }
    } catch (error) {
      console.error('Error loading build data:', error);
      toast.error('Failed to load app build data');
      return null;
    }
  };

  // Handle viewing a build from history
  const handleViewBuild = (build: AppBuild) => {
    setSelectedBuild(build);
    
    // Update URL when viewing a build
    navigate(`/builder?id=${build.id}`, { replace: true });
    
    // Load the build data if it's not already loaded
    loadBuildData(build.id);
  };
  
  // Handle remixing a build
  const handleRemixBuild = (build: AppBuild) => {
    setPromptInputValue(build.prompt);
    setSelectedBuild(null);
    setIsComplete(false);
    setSpec('');
    setCode('');
    setBuildError(null);
    
    // Scroll to the prompt input
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    toast.info(`App prompt loaded for remixing: ${build.appName}`);
    
    // Clear the URL query parameter
    navigate('/builder', { replace: true });
  };

  return {
    isProcessing,
    currentStep,
    steps,
    spec,
    code,
    isComplete,
    selectedBuild,
    promptInputValue,
    buildError,
    handleSubmit,
    handleViewBuild,
    handleRemixBuild,
    loadBuildData,
    setPromptInputValue
  };
}
