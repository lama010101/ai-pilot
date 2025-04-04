
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppBuild } from '@/types/supabase';
import { useAppBuilderState } from './useAppBuilderState';
import { useAppBuilderService } from './useAppBuilderService';
import { useAppBuilderEffects } from './useAppBuilderEffects';

export function useAppBuilder() {
  const {
    isProcessing, setIsProcessing,
    currentStep, setCurrentStep,
    spec, setSpec,
    code, setCode,
    isComplete, setIsComplete,
    selectedBuild, setSelectedBuild,
    promptInputValue, setPromptInputValue,
    buildError, setBuildError
  } = useAppBuilderState();
  
  const {
    createBuildRecord,
    startBuildProcess,
    loadBuildData,
    navigateToBuild
  } = useAppBuilderService();
  
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Handle updates from build status polling
  const handleBuildStatusChange = useCallback((updatedBuild: any, isComplete: boolean) => {
    if (updatedBuild.build_log && updatedBuild.build_log.length > 0) {
      const completedSteps = updatedBuild.build_log.filter(
        (step: any) => step.status === 'success'
      ).length;
      setCurrentStep(Math.min(completedSteps, 5));
    }
    
    if (updatedBuild.spec) {
      setSpec(updatedBuild.spec);
    }
    
    if (updatedBuild.code) {
      setCode(updatedBuild.code);
    }
    
    if (isComplete) {
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
    }
  }, [setCode, setCurrentStep, setIsComplete, setIsProcessing, setSelectedBuild, setSpec]);
  
  // Start polling for build status
  const { startPolling } = useAppBuilderEffects(
    selectedBuild?.id || null,
    handleBuildStatusChange,
    setBuildError
  );
  
  // Define the steps in the build process
  const steps = [
    'Analyzing prompt...',
    'Generating app specification...',
    'Building application code...',
    'Packaging application...',
    'Deploying preview...',
    'Complete!'
  ];

  // Submit a new app build
  const handleSubmit = async (prompt: string) => {
    setBuildError(null);
    
    if (!prompt || prompt.trim() === '') {
      setBuildError('Please enter a description of the app you want to build');
      toast.error('Please enter a description of the app you want to build');
      return;
    }
    
    if (!user) {
      const errorMessage = 'You need to be logged in to build an app';
      setBuildError(errorMessage);
      toast.error(errorMessage);
      navigate('/login');
      return;
    }

    console.log('User authenticated:', user);
    
    setIsProcessing(true);
    setCurrentStep(0);
    setSpec('');
    setCode('');
    setIsComplete(false);
    
    try {
      // Step 1: Create the build record
      const buildData = await createBuildRecord(prompt, user.id);
      
      if (!buildData) {
        throw new Error('Failed to create build record');
      }
      
      // Step 2: Trigger the build process
      await startBuildProcess(buildData.id, prompt, user.id);
      
      // Step 3: Navigate to the builder page with the build ID
      // We use navigate instead of location.reload() to prevent state loss
      navigate(`/dashboard/builder?id=${buildData.id}`);
      
      toast.info('Build process started. This may take a few minutes.');
      
      // Step 4: Start polling for build status
      startPolling(buildData.id);
      
    } catch (error) {
      console.error('Error building app:', error);
      setIsProcessing(false);
      
      let errorMessage = 'Failed to build app. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Build failed: ${error.message}`;
      }
      
      setBuildError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Load build data for an existing build
  const loadBuildDataWrapper = async (buildId: string) => {
    try {
      const result = await loadBuildData(buildId);
      
      if (result) {
        const { build, spec: buildSpec, code: buildCode } = result;
        
        setSpec(buildSpec);
        setCode(buildCode);
        setIsComplete(build.status === 'complete');
        setSelectedBuild(build);
        
        return build;
      }
    } catch (error) {
      console.error('Error loading build data:', error);
      toast.error('Failed to load app build data');
      return null;
    }
  };

  // View a specific build
  const handleViewBuild = (build: AppBuild) => {
    setSelectedBuild(build);
    navigate(`/dashboard/builder?id=${build.id}`, { replace: true });
    loadBuildDataWrapper(build.id);
  };

  // Remix an existing build
  const handleRemixBuild = (build: AppBuild) => {
    setPromptInputValue(build.prompt);
    setSelectedBuild(null);
    setIsComplete(false);
    setSpec('');
    setCode('');
    setBuildError(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    toast.info(`App prompt loaded for remixing: ${build.appName}`);
    
    navigate('/dashboard/builder', { replace: true });
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
    loadBuildData: loadBuildDataWrapper,
    setPromptInputValue
  };
}
