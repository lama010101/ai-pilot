
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAppBuilds } from '@/lib/buildService';
import { AppBuild } from '@/lib/supabaseTypes';

export function useBuildHistory() {
  const [appBuilds, setAppBuilds] = useState<AppBuild[]>([]);
  const [isShowingHistory, setIsShowingHistory] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  
  const { user } = useAuth();
  
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
          appName: build.app_name,
          created_at: build.timestamp // Add created_at field that maps to timestamp
        }));
        
        setAppBuilds(builds);
      }
    } catch (error) {
      console.error('Error fetching build history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Add a build to history
  const addBuildToHistory = (build: AppBuild) => {
    setAppBuilds(prev => {
      // Check if the build already exists in history
      const exists = prev.some(b => b.id === build.id);
      if (exists) {
        // Replace the existing build with the updated one
        return prev.map(b => b.id === build.id ? build : b);
      } else {
        // Add the new build to the beginning of the list
        return [build, ...prev];
      }
    });
  };
  
  // Toggle history visibility
  const toggleHistory = () => {
    setIsShowingHistory(!isShowingHistory);
  };
  
  // Effect to fetch history when user changes
  useEffect(() => {
    if (user) {
      fetchBuildHistory();
    }
  }, [user]);
  
  return {
    appBuilds,
    isShowingHistory,
    isLoadingHistory,
    fetchBuildHistory,
    addBuildToHistory,
    toggleHistory
  };
}
