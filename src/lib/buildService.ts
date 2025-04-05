
import { supabase } from '@/integrations/supabase/client';
import { AppBuildDB } from '@/types/supabase';

// TypeScript interface extensions (to ensure all needed fields are present)
export interface BuildWithLogs extends AppBuildDB {
  build_log: Array<{
    step: string;
    status: string;
    message: string;
    timestamp: string;
  }>;
}

/**
 * Create a new app build in Supabase
 */
export const createAppBuild = async (prompt: string, appName: string, userId: string) => {
  try {
    // Validate that userId is present to satisfy RLS
    if (!userId) {
      console.error('Cannot create app build: user ID is missing');
      return { 
        data: null, 
        error: new Error('Authentication required. Please log in to create a build.') 
      };
    }

    console.log('Creating app build with:', { prompt, appName, userId });

    const { data, error } = await supabase
      .from('app_builds')
      .insert({
        user_id: userId, // Ensure user_id is always included to satisfy RLS
        prompt,
        app_name: appName,
        status: 'processing',
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating app build:', error);
      return { data: null, error };
    }
    
    console.log('App build created successfully:', data);
    return { data: data as AppBuildDB };
  } catch (error) {
    console.error('Error creating app build:', error);
    return { data: null, error };
  }
};

/**
 * Get an app build by ID
 */
export const getAppBuildById = async (buildId: string) => {
  try {
    if (!buildId) {
      console.error('Cannot get app build: build ID is missing');
      return { 
        data: null, 
        error: new Error('Build ID is required to fetch build data') 
      };
    }

    const { data, error } = await supabase
      .from('app_builds')
      .select('*')
      .eq('id', buildId)
      .single();
      
    if (error) {
      console.error('Error fetching app build:', error);
      return { data: null, error };
    }
    
    return { data: data as BuildWithLogs };
  } catch (error) {
    console.error('Error fetching app build:', error);
    return { data: null, error };
  }
};

/**
 * Update an app build
 */
export const updateAppBuild = async (buildId: string, updates: Partial<AppBuildDB>) => {
  try {
    if (!buildId) {
      console.error('Cannot update app build: build ID is missing');
      return { 
        data: null, 
        error: new Error('Build ID is required to update build data') 
      };
    }

    const { data, error } = await supabase
      .from('app_builds')
      .update(updates)
      .eq('id', buildId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating app build:', error);
      return { data: null, error };
    }
    
    return { data: data as AppBuildDB };
  } catch (error) {
    console.error('Error updating app build:', error);
    return { data: null, error };
  }
};

/**
 * Get all app builds for a user
 */
export const getUserAppBuilds = async (userId: string) => {
  try {
    if (!userId) {
      console.error('Cannot get user app builds: user ID is missing');
      return { 
        data: null, 
        error: new Error('User ID is required to fetch build history') 
      };
    }

    const { data, error } = await supabase
      .from('app_builds')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Error fetching user app builds:', error);
      return { data: null, error };
    }
    
    return { data: data as AppBuildDB[] };
  } catch (error) {
    console.error('Error fetching user app builds:', error);
    return { data: null, error };
  }
};

/**
 * Trigger a remote app build using the edge function
 */
export const triggerAppBuild = async (buildId: string, prompt: string, userId: string) => {
  try {
    if (!buildId || !userId) {
      console.error('Cannot trigger app build: required parameters missing');
      return { 
        data: null, 
        error: new Error('Build ID and User ID are required to trigger a build') 
      };
    }

    console.log('Triggering app build with:', { buildId, prompt, userId });

    // Add a try-catch block specifically for the function invocation
    try {
      const { data, error } = await supabase.functions.invoke('build-app', {
        body: { buildId, prompt, userId }
      });
      
      if (error) {
        console.error('Error invoking build-app function:', error);
        return { data: null, error };
      }

      console.log('Build process triggered successfully:', data);
      return { data, error: null };
    } catch (functionError) {
      console.error('Exception when invoking function:', functionError);
      return { 
        data: null, 
        error: new Error(`Failed to invoke build function: ${functionError.message}`) 
      };
    }
  } catch (error) {
    console.error('Error in triggerAppBuild:', error);
    return { data: null, error };
  }
};

/**
 * Get a public shareable URL for an app build
 */
export const getShareableUrl = (buildId: string) => {
  return `${window.location.origin}/builder?id=${buildId}`;
};

/**
 * Export the build as a ZIP file
 */
export const exportBuild = async (buildId: string, userId: string) => {
  try {
    if (!buildId || !userId) {
      console.error('Cannot export build: required parameters missing');
      return { downloadUrl: null, fileName: null, error: new Error('Build ID and User ID are required to export') };
    }

    const { data, error } = await supabase.functions.invoke('export-build', {
      body: { buildId, userId }
    });
    
    if (error) {
      console.error('Error exporting build:', error);
      return { downloadUrl: null, fileName: null, error };
    }
    
    if (!data.success) {
      console.error('Error exporting build:', data.error);
      return { downloadUrl: null, fileName: null, error: new Error(data.error) };
    }
    
    return { 
      downloadUrl: data.downloadUrl, 
      fileName: data.fileName,
      error: null 
    };
  } catch (error) {
    console.error('Error exporting build:', error);
    return { downloadUrl: null, fileName: null, error };
  }
};

/**
 * Trigger a hosting preview for the build
 */
export const triggerHostingPreview = async (buildId: string, userId: string) => {
  try {
    if (!buildId || !userId) {
      console.error('Cannot trigger hosting preview: required parameters missing');
      return { previewUrl: null, error: new Error('Build ID and User ID are required to deploy preview') };
    }

    const { data, error } = await supabase.functions.invoke('preview-build', {
      body: { buildId, userId }
    });
    
    if (error) {
      console.error('Error triggering hosting preview:', error);
      return { previewUrl: null, error };
    }
    
    if (!data.success) {
      console.error('Error triggering hosting preview:', data.error);
      return { previewUrl: null, error: new Error(data.error) };
    }
    
    return { previewUrl: data.previewUrl, error: null };
  } catch (error) {
    console.error('Error triggering hosting preview:', error);
    return { previewUrl: null, error };
  }
};
