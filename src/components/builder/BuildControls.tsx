
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Rocket } from 'lucide-react';
import { AppBuild } from '@/types/supabase';

interface BuildControlsProps {
  selectedBuild: AppBuild | null;
  isExporting: boolean;
  isPreviewLoading: boolean;
  isDeploying: boolean;
  onExport: () => void;
  onPreview: () => void;
  onDeploy: () => void;
}

/**
 * Component for build action buttons (export, preview, deploy)
 */
const BuildControls: React.FC<BuildControlsProps> = ({
  selectedBuild,
  isExporting,
  isPreviewLoading,
  isDeploying,
  onExport,
  onPreview,
  onDeploy
}) => {
  // Determine if build actions should be disabled
  const isBuildComplete = selectedBuild?.status === 'complete';
  const hasValidBuild = !!selectedBuild?.id && isBuildComplete;

  return (
    <div className="flex justify-between">
      <div className="flex gap-2">
        <Button 
          onClick={onExport}
          className="flex items-center gap-2"
          variant="outline"
          disabled={isExporting || !hasValidBuild}
        >
          {isExporting ? (
            <>Exporting...</>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export Code
            </>
          )}
        </Button>
        
        <Button 
          onClick={onPreview}
          className="flex items-center gap-2"
          variant="outline"
          disabled={isPreviewLoading || !hasValidBuild}
        >
          {isPreviewLoading ? (
            <>Deploying Preview...</>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Live Preview
            </>
          )}
        </Button>
      </div>
      
      <Button 
        onClick={onDeploy}
        className="flex items-center gap-2"
        variant="default"
        disabled={isDeploying || !hasValidBuild}
      >
        {isDeploying ? (
          <>Deploying...</>
        ) : (
          <>
            <Rocket className="h-4 w-4" />
            Deploy App
          </>
        )}
      </Button>
    </div>
  );
};

export default BuildControls;
