
import { useState, useCallback, useEffect } from 'react';
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
    logs, setLogs,
    appendLog,
    copyLogs,
    isComplete, setIsComplete,
    selectedBuild, setSelectedBuild,
    promptInputValue, setPromptInputValue,
    buildError, setBuildError,
    isLoadingSpec, setIsLoadingSpec,
    isLoadingCode, setIsLoadingCode,
    isLoadingPreview, setIsLoadingPreview,
    autoBuild, setAutoBuild,
    expandedBuildIds, toggleBuildExpansion,
    isPromptInputCollapsed, setIsPromptInputCollapsed,
    showFullLogs, setShowFullLogs
  } = useAppBuilderState();
  
  const {
    createBuildRecord,
    startBuildProcess,
    loadBuildData,
    navigateToBuild
  } = useAppBuilderService();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Handle updates from build status polling
  const handleBuildStatusChange = useCallback((updatedBuild: any, isComplete: boolean) => {
    if (updatedBuild.build_log && updatedBuild.build_log.length > 0) {
      const completedSteps = updatedBuild.build_log.filter(
        (step: any) => step.status === 'success'
      ).length;
      setCurrentStep(Math.min(completedSteps, 5));
      
      // Update logs
      const buildLogs = updatedBuild.build_log.map((logEntry: any) => 
        `[${new Date(logEntry.timestamp).toLocaleTimeString()}] ${logEntry.message}`
      );
      setLogs(buildLogs);
    }
    
    if (updatedBuild.spec) {
      setSpec(updatedBuild.spec);
      setIsLoadingSpec(false);
    }
    
    if (updatedBuild.code) {
      setCode(updatedBuild.code);
      setIsLoadingCode(false);
    }
    
    if (updatedBuild.preview_url) {
      setIsLoadingPreview(false);
    }
    
    if (isComplete) {
      setIsComplete(true);
      setIsProcessing(false);
      setIsLoadingSpec(false);
      setIsLoadingCode(false);
      setIsLoadingPreview(false);
      
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
      
      // Add final log instead of toast
      appendLog('success', 'Build completed successfully');
    }
    
    // Handle errors in the build process
    if (updatedBuild.status === 'failed') {
      setIsProcessing(false);
      setIsLoadingSpec(false);
      setIsLoadingCode(false);
      setIsLoadingPreview(false);
      
      const errorMessage = updatedBuild.error_message || 'Build failed for unknown reasons';
      setBuildError(errorMessage);
      
      // Add error to logs
      appendLog('error', errorMessage);
      
      console.error('Build process failed:', errorMessage);
    }
  }, [setCode, setCurrentStep, setIsComplete, setIsProcessing, setSelectedBuild, setSpec, setLogs, setBuildError, setIsLoadingSpec, setIsLoadingCode, setIsLoadingPreview, appendLog]);
  
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

  // Reset build state
  const resetBuildState = () => {
    setSpec('');
    setCode('');
    setLogs([]);
    setIsComplete(false);
    setSelectedBuild(null);
    setBuildError(null);
    setIsLoadingSpec(false);
    setIsLoadingCode(false);
    setIsLoadingPreview(false);
  };

  // Continue to build after spec is generated (for manual mode)
  const continueToBuild = async () => {
    if (!selectedBuild) {
      console.error('No build selected to continue');
      return;
    }

    setIsLoadingCode(true);
    setIsLoadingPreview(true);
    
    try {
      // Add log
      appendLog('info', 'Continuing build process after specification');
      
      // Trigger the next step of the build
      await startBuildProcess(selectedBuild.id, selectedBuild.prompt, user?.id || '');
      
      // Start polling for status updates
      startPolling(selectedBuild.id);
      
      console.log('Continuing build process with code generation');
    } catch (error) {
      console.error('Error continuing build:', error);
      setIsLoadingCode(false);
      setIsLoadingPreview(false);
      
      let errorMessage = 'Failed to continue build. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Build continuation failed: ${error.message}`;
      }
      
      setBuildError(errorMessage);
      appendLog('error', errorMessage);
    }
  };

  // Submit a new app build
  const handleSubmit = async (prompt: string) => {
    resetBuildState();
    setBuildError(null);
    
    if (!prompt || prompt.trim() === '') {
      setBuildError('Please enter a description of the app you want to build');
      appendLog('error', 'Empty prompt submitted');
      return;
    }
    
    if (!user) {
      const errorMessage = 'You need to be logged in to build an app';
      setBuildError(errorMessage);
      console.error(errorMessage);
      navigate('/login');
      return;
    }

    console.log('User authenticated:', user);
    
    setIsProcessing(true);
    setCurrentStep(0);
    setIsLoadingSpec(true);
    
    // Only set loading for code and preview if autoBuild is true
    if (autoBuild) {
      setIsLoadingCode(true);
      setIsLoadingPreview(true);
    }
    
    // Start with an initial log
    setLogs([`[${new Date().toLocaleTimeString()}] Starting build process for: "${prompt}"`]);
    
    try {
      // Step 1: Create the build record
      const buildData = await createBuildRecord(prompt, user.id);
      
      if (!buildData) {
        throw new Error('Failed to create build record');
      }
      
      appendLog('info', `Build record created with ID: ${buildData.id}`);
      
      // Auto-expand the new build in the history
      toggleBuildExpansion(buildData.id);
      
      // Step 2: Trigger the build process
      await startBuildProcess(buildData.id, prompt, user.id);
      
      // Step 3: Navigate to the builder page with the build ID
      const currentPath = window.location.pathname;
      const basePath = currentPath.includes('/dashboard-dev') ? '/dashboard-dev' : '/dashboard';
      navigate(`${basePath}/builder?id=${buildData.id}`);
      
      const message = autoBuild 
        ? 'Build process started. This may take a few minutes.' 
        : 'Generating app specification. You will be able to review before continuing.';
      
      appendLog('info', message);
      
      // Step 4: Start polling for build status
      startPolling(buildData.id);
      
    } catch (error) {
      console.error('Error building app:', error);
      setIsProcessing(false);
      setIsLoadingSpec(false);
      setIsLoadingCode(false);
      setIsLoadingPreview(false);
      
      let errorMessage = 'Failed to build app. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Build failed: ${error.message}`;
      }
      
      setBuildError(errorMessage);
      appendLog('error', errorMessage);
    }
  };

  // Load build data for an existing build
  const loadBuildDataWrapper = async (buildId: string) => {
    try {
      appendLog('info', `Loading build data for ID: ${buildId}`);
      
      const result = await loadBuildData(buildId);
      
      if (result) {
        const { build, spec: buildSpec, code: buildCode, buildLogs } = result;
        
        setSpec(buildSpec);
        setCode(buildCode);
        setIsComplete(build.status === 'complete');
        setSelectedBuild(build);
        
        if (buildLogs && buildLogs.length > 0) {
          const formattedLogs = buildLogs.map((logEntry: any) => 
            `[${new Date(logEntry.timestamp).toLocaleTimeString()}] ${logEntry.message}`
          );
          setLogs(formattedLogs);
        }
        
        appendLog('info', `Build "${build.appName}" loaded successfully`);
        return build;
      }
    } catch (error) {
      console.error('Error loading build data:', error);
      let errorMessage = 'Failed to load build data';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      appendLog('error', errorMessage);
      return null;
    }
  };

  // View a specific build
  const handleViewBuild = (build: AppBuild) => {
    resetBuildState();
    setSelectedBuild(build);
    
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/dashboard-dev') ? '/dashboard-dev' : '/dashboard';
    navigate(`${basePath}/builder?id=${build.id}`, { replace: true });
    
    loadBuildDataWrapper(build.id);
    
    // Auto-expand the viewed build in history
    toggleBuildExpansion(build.id);
    
    appendLog('info', `Viewing build: ${build.appName}`);
  };

  // Remix an existing build
  const handleRemixBuild = (build: AppBuild) => {
    resetBuildState();
    setPromptInputValue(build.prompt);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    appendLog('info', `App prompt loaded for remixing: ${build.appName}`);
    
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/dashboard-dev') ? '/dashboard-dev' : '/dashboard';
    navigate(`${basePath}/builder`, { replace: true });
  };

  return {
    isProcessing,
    currentStep,
    steps,
    spec,
    code,
    logs,
    isComplete,
    selectedBuild,
    promptInputValue,
    buildError,
    isLoadingSpec,
    isLoadingCode,
    isLoadingPreview,
    handleSubmit,
    handleViewBuild,
    handleRemixBuild,
    loadBuildData: loadBuildDataWrapper,
    setPromptInputValue,
    continueToBuild,
    autoBuild,
    setAutoBuild,
    expandedBuildIds,
    toggleBuildExpansion,
    appendLog,
    copyLogs,
    isPromptInputCollapsed,
    setIsPromptInputCollapsed,
    showFullLogs,
    setShowFullLogs
  };
}
