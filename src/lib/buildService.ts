import { supabase } from '@/integrations/supabase/client';
import { AppBuildDB } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Create a new app build in Supabase
 */
export const createAppBuild = async (prompt: string, appName: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('app_builds')
      .insert({
        user_id: userId,
        prompt,
        app_name: appName,
        status: 'processing',
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('app_builds')
      .select('*')
      .eq('id', buildId)
      .single();
      
    if (error) throw error;
    return { data: data as AppBuildDB };
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
    const { data, error } = await supabase
      .from('app_builds')
      .update(updates)
      .eq('id', buildId)
      .select()
      .single();
      
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('app_builds')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) throw error;
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
    const { data, error } = await supabase.functions.invoke('build-app', {
      body: { buildId, prompt, userId }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error triggering app build:', error);
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
    const { data, error } = await supabase.functions.invoke('export-build', {
      body: { buildId, userId }
    });
    
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return { 
      downloadUrl: data.downloadUrl, 
      fileName: data.fileName,
      error: null 
    };
  } catch (error) {
    console.error('Error exporting build:', error);
    toast.error('Failed to export build', {
      description: error.message
    });
    return { downloadUrl: null, fileName: null, error };
  }
};

/**
 * Trigger a hosting preview for the build
 */
export const triggerHostingPreview = async (buildId: string, userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('preview-build', {
      body: { buildId, userId }
    });
    
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return { previewUrl: data.previewUrl, error: null };
  } catch (error) {
    console.error('Error triggering hosting preview:', error);
    toast.error('Failed to deploy preview', {
      description: error.message
    });
    return { previewUrl: null, error };
  }
};
