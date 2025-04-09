
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { getAppBuildById } from '@/lib/buildService';
import { AppBuild } from '@/lib/supabaseTypes';

export function useUrlParams(
  onLoadBuild: (build: AppBuild) => void
) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Parse the URL query string to get build ID
  const getSharedBuildId = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('id');
  };
  
  // Load shared build from URL
  useEffect(() => {
    const loadSharedBuild = async () => {
      const buildId = getSharedBuildId();
      
      if (buildId) {
        try {
          const { data: buildData } = await getAppBuildById(buildId);
          
          if (buildData) {
            const build: AppBuild = {
              id: buildData.id,
              prompt: buildData.prompt,
              status: buildData.status as 'processing' | 'complete' | 'failed',
              timestamp: buildData.timestamp,
              previewUrl: buildData.preview_url,
              appName: buildData.app_name,
              created_at: buildData.timestamp // Use timestamp as created_at
            };
            
            onLoadBuild(build);
            
            toast.success(`Loaded shared app: ${buildData.app_name}`);
          } else {
            toast.error('Could not load the shared app build');
          }
        } catch (error) {
          console.error('Error loading shared build:', error);
          toast.error('Failed to load the shared app build');
        }
      }
    };
    
    if (user) {
      loadSharedBuild();
    }
  }, [user, location.search, onLoadBuild]);
  
  return {
    buildId: getSharedBuildId()
  };
}
