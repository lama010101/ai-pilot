
import { supabase } from '@/integrations/supabase/client';
import { AppBuildDB } from '@/types/supabase';

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
      .single() as { data: AppBuildDB | null, error: any };
      
    if (error) throw error;
    return { data };
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
      .single() as { data: AppBuildDB | null, error: any };
      
    if (error) throw error;
    return { data };
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
      .single() as { data: AppBuildDB | null, error: any };
      
    if (error) throw error;
    return { data };
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
      .order('timestamp', { ascending: false }) as { data: AppBuildDB[] | null, error: any };
      
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error fetching user app builds:', error);
    return { data: null, error };
  }
};
