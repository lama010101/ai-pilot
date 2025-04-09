
import { useState } from 'react';
import { toast } from "sonner";
import { AppBuild } from '@/lib/supabaseTypes';
import { exportBuild, triggerHostingPreview } from '@/lib/buildService';

type User = {
  id: string;
  [key: string]: any;
};

/**
 * Hook to handle build actions like export, preview, and deploy
 */
export function useBuildActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  /**
   * Export the build as a ZIP file
   */
  const handleExport = async (selectedBuild: AppBuild | null, user: User | null) => {
    // Validate required data
    if (!selectedBuild || !user) {
      toast.error('Unable to export build', { description: 'Build information or user data is missing' });
      return;
    }
    
    if (!selectedBuild.id) {
      toast.error('Unable to export build', { description: 'Build ID is missing' });
      return;
    }
    
    setIsExporting(true);
    
    try {
      const { downloadUrl, fileName, error } = await exportBuild(selectedBuild.id, user.id);
      
      if (error) throw error;
      
      // Create a link element and trigger the download
      if (downloadUrl && fileName) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Build exported successfully!');
      } else {
        throw new Error('Download URL or filename not provided');
      }
    } catch (error) {
      console.error('Error exporting build:', error);
      toast.error(`Export failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Trigger a preview deployment of the build
   */
  const handlePreview = async (selectedBuild: AppBuild | null, user: User | null) => {
    // Validate required data
    if (!selectedBuild || !user) {
      toast.error('Unable to preview build', { description: 'Build information or user data is missing' });
      return;
    }
    
    if (!selectedBuild.id) {
      toast.error('Unable to preview build', { description: 'Build ID is missing' });
      return;
    }
    
    setIsPreviewLoading(true);
    
    try {
      const { previewUrl, error } = await triggerHostingPreview(selectedBuild.id, user.id);
      
      if (error) throw error;
      
      if (previewUrl) {
        // Open in new tab
        window.open(previewUrl, '_blank');
        
        toast.success('Preview deployed successfully!');
      } else {
        throw new Error('Preview URL not provided');
      }
    } catch (error) {
      console.error('Error deploying preview:', error);
      toast.error(`Preview deployment failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  /**
   * Deploy the app to production
   */
  const handleDeploy = async (selectedBuild: AppBuild | null, user: User | null) => {
    // Validate required data
    if (!selectedBuild || !user) {
      toast.error('Unable to deploy build', { description: 'Build information or user data is missing' });
      return;
    }
    
    if (!selectedBuild.id) {
      toast.error('Unable to deploy build', { description: 'Build ID is missing' });
      return;
    }
    
    setIsDeploying(true);
    
    try {
      // In a real implementation, this would call a deployment API
      // For now, we'll simulate a successful deployment
      toast.info('Deployment in progress! Your app will be available shortly.');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('App deployed successfully! You can access it at the production URL.');
    } catch (error) {
      console.error('Error deploying build:', error);
      toast.error(`Deployment failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    isExporting,
    isPreviewLoading,
    isDeploying,
    handleExport,
    handlePreview,
    handleDeploy
  };
}
