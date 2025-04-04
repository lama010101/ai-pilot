
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Rocket } from "lucide-react";
import { AppBuild } from '@/types/supabase';
import { getShareableUrl } from '@/lib/buildService';

interface BuildControlsProps {
  selectedBuild: AppBuild | null;
  isExporting: boolean;
  isPreviewLoading: boolean;
  isDeploying: boolean;
  onExport: () => void;
  onPreview: () => void;
  onDeploy: () => void;
  hasPreview?: boolean;
}

/**
 * Component to display action buttons for a completed build
 */
const BuildControls: React.FC<BuildControlsProps> = ({
  selectedBuild,
  isExporting,
  isPreviewLoading,
  isDeploying,
  onExport,
  onPreview,
  onDeploy,
  hasPreview = false
}) => {
  if (!selectedBuild) return null;
  
  // Generate a shareable link for the build
  const shareableUrl = getShareableUrl(selectedBuild.id);
  
  return (
    <div className="w-full flex flex-wrap gap-3 justify-between items-center">
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(shareableUrl);
          }}
        >
          Copy Shareable Link
        </Button>
      </div>
      
      <div className="flex space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Code'}
        </Button>
        
        <Button
          variant={hasPreview ? "default" : "outline"}
          size="sm"
          onClick={onPreview}
          disabled={isPreviewLoading || !hasPreview}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {isPreviewLoading ? 'Loading...' : 'View Preview'}
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={onDeploy}
          disabled={isDeploying}
        >
          <Rocket className="mr-2 h-4 w-4" />
          {isDeploying ? 'Deploying...' : 'Deploy App'}
        </Button>
      </div>
    </div>
  );
};

export default BuildControls;
