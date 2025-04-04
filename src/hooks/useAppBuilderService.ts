
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { 
  createAppBuild, 
  getAppBuildById, 
  triggerAppBuild 
} from '@/lib/buildService';
import { AppBuild } from '@/types/supabase';

export function useAppBuilderService() {
  const navigate = useNavigate();
  
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

  // Create a new app build record in the database
  const createBuildRecord = async (prompt: string, userId: string) => {
    try {
      const appName = generateAppName(prompt);
      console.log('Creating build with:', { prompt, appName, userId });
      
      const { data: buildData, error: createError } = await createAppBuild(prompt, appName, userId);
      
      if (createError || !buildData) {
        console.error('Failed to create build record:', createError);
        const errorMessage = createError?.message || 'Failed to create build record';
        throw new Error(errorMessage);
      }
      
      console.log('Build record created:', buildData);
      return buildData;
    } catch (error) {
      console.error('Error creating build record:', error);
      throw error;
    }
  };

  // Trigger the build process via edge function
  const startBuildProcess = async (buildId: string, prompt: string, userId: string) => {
    try {
      console.log('Triggering build process for build ID:', buildId);
      const { data: buildResult, error: buildError } = await triggerAppBuild(buildId, prompt, userId);
      
      if (buildError) {
        console.error('Failed to trigger build process:', buildError);
        throw buildError;
      }
      
      console.log('Build process triggered:', buildResult);
      return buildResult;
    } catch (error) {
      console.error('Error triggering build process:', error);
      throw error;
    }
  };

  // Load an existing build by ID
  const loadBuildData = async (buildId: string) => {
    try {
      const { data: buildData, error } = await getAppBuildById(buildId);
      
      if (error) {
        console.error('Error fetching build data:', error);
        toast.error('Failed to load app build data');
        return null;
      }
      
      if (buildData) {
        const build: AppBuild = {
          id: buildData.id,
          prompt: buildData.prompt,
          status: buildData.status as 'processing' | 'complete' | 'failed',
          timestamp: buildData.timestamp,
          previewUrl: buildData.preview_url,
          exportUrl: buildData.export_url,
          appName: buildData.app_name
        };
        
        return {
          build,
          spec: buildData.spec || '',
          code: buildData.code || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading build data:', error);
      toast.error('Failed to load app build data');
      return null;
    }
  };

  // Navigate to a build page
  const navigateToBuild = (buildId: string) => {
    try {
      navigate(`/builder?id=${buildId}`, { replace: false });
    } catch (navError) {
      console.error('Navigation error:', navError);
    }
  };

  return {
    generateAppName,
    createBuildRecord,
    startBuildProcess,
    loadBuildData,
    navigateToBuild
  };
}
