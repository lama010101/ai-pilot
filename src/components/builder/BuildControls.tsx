
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Rocket } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppBuild } from '@/lib/supabaseTypes';
import { getShareableUrl } from '@/lib/buildService';
import { cn } from "@/lib/utils";

interface BuildControlsProps {
  selectedBuild: AppBuild | null;
  isExporting: boolean;
  isPreviewLoading: boolean;
  isDeploying: boolean;
  onExport: () => void;
  onPreview: () => void;
  onDeploy: () => void;
  hasPreview?: boolean;
  autoBuild: boolean;
  onAutoBuildChange: (enabled: boolean) => void;
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
  hasPreview = false,
  autoBuild,
  onAutoBuildChange
}) => {
  if (!selectedBuild) return null;
  
  // Generate a shareable link for the build
  const shareableUrl = getShareableUrl(selectedBuild.id);

  // Handle copy to clipboard
  const handleCopyShareableLink = () => {
    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        console.log("Shareable link copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
      });
  };

  const handleAutoBuildToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onAutoBuildChange(!autoBuild);
  };
  
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyShareableLink}
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
            {isPreviewLoading ? 'Loading...' : hasPreview ? 'View Preview' : 'No Preview Available'}
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

      <div className="flex items-center space-x-2 self-end">
        <Switch 
          id="auto-build" 
          checked={autoBuild} 
          onCheckedChange={onAutoBuildChange}
        />
        <Label htmlFor="auto-build">Auto-Build After Spec</Label>
      </div>
    </div>
  );
};

export default BuildControls;
