
import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { getAppBuildById } from '@/lib/buildService';
import { AppBuild } from '@/types/supabase';

export function useAppBuilderEffects(
  selectedBuildId: string | null,
  onBuildStatusChange: (updatedBuild: any, isComplete: boolean) => void,
  onBuildError: (message: string) => void
) {
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Safely store build data in localStorage
  const safeSaveBuild = (build: AppBuild) => {
    try {
      const testJson = JSON.stringify(build);
      JSON.parse(testJson); // Validate JSON is valid
      localStorage.setItem(`build_${build.id}`, testJson);
      console.log('Build saved to localStorage:', build.id);
    } catch (storageError) {
      console.error('Failed to save build to localStorage:', storageError);
      // Don't crash if storage fails
    }
  };

  // Check build status periodically
  const checkBuildStatus = async (buildId: string) => {
    try {
      console.log('Checking build status for:', buildId);
      const { data: updatedBuild, error: statusError } = await getAppBuildById(buildId);
      
      if (statusError) {
        console.error('Error checking build status:', statusError);
        return null;
      }
      
      if (!updatedBuild) {
        console.warn('No build data returned when checking status');
        return null;
      }
      
      // Process build status
      const isComplete = updatedBuild.status === 'complete';
      const isFailed = updatedBuild.status === 'failed';
      
      // Call the provided callback with the updated build data
      onBuildStatusChange(updatedBuild, isComplete);
      
      // Handle build completion
      if (isComplete) {
        try {
          const completedBuild: AppBuild = {
            id: updatedBuild.id,
            prompt: updatedBuild.prompt,
            status: 'complete',
            timestamp: updatedBuild.timestamp,
            previewUrl: updatedBuild.preview_url,
            exportUrl: updatedBuild.export_url,
            appName: updatedBuild.app_name
          };
          
          // Safety: Save to localStorage with proper validation
          safeSaveBuild(completedBuild);
          
          // Stop polling
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            window.clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          toast.success('App successfully built!');
          return completedBuild;
        } catch (buildError) {
          console.error('Error processing completed build:', buildError);
        }
      } else if (isFailed) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          window.clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        const failMessage = 'App build failed. Please try a different prompt.';
        onBuildError(failMessage);
        toast.error(failMessage);
      }
      
      return null;
    } catch (checkError) {
      console.error('Error in checkBuildStatus:', checkError);
      return null;
    }
  };

  // Start polling for build status
  const startPolling = (buildId: string) => {
    if (!buildId) return;
    
    console.log('Starting polling for build ID:', buildId);
    setIsPolling(true);
    
    // Clear any existing intervals
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
    }
    
    // Start with an immediate check
    checkBuildStatus(buildId);
    
    // Then check every 5 seconds
    pollingIntervalRef.current = window.setInterval(() => {
      checkBuildStatus(buildId);
    }, 5000);
    
    // Set a timeout to stop polling after 5 minutes
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      if (isPolling) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          window.clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        const timeoutMessage = 'Build process timed out. Please check the build status later.';
        onBuildError(timeoutMessage);
        toast.error('Build process is taking longer than expected. Please check the build status later.');
      }
    }, 5 * 60 * 1000);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isPolling,
    startPolling,
    checkBuildStatus,
    safeSaveBuild
  };
}
