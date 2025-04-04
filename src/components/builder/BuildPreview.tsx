
import React, { useRef, useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppBuild } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useBuildActions } from '@/hooks/useBuildActions';
import BuildResultTabs from './BuildResultTabs';
import BuildControls from './BuildControls';

interface BuildPreviewProps {
  spec: string;
  code: string;
  logs: string[];
  isComplete: boolean;
  isLoadingSpec: boolean;
  isLoadingCode: boolean;
  isLoadingPreview: boolean;
  selectedBuild: AppBuild | null;
  onContinueToBuild?: () => void;
  autoBuild: boolean;
  onAutoBuildChange: (enabled: boolean) => void;
}

/**
 * Component to display build results and provide action buttons
 */
const BuildPreview: React.FC<BuildPreviewProps> = ({ 
  spec, 
  code,
  logs,
  isComplete, 
  isLoadingSpec,
  isLoadingCode,
  isLoadingPreview,
  selectedBuild,
  onContinueToBuild,
  autoBuild,
  onAutoBuildChange
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const { 
    isExporting, 
    isPreviewLoading, 
    isDeploying, 
    handleExport, 
    handlePreview, 
    handleDeploy 
  } = useBuildActions();

  // Don't render if no build data is available and nothing is loading
  if (!spec && !code && !isComplete && !selectedBuild && !isLoadingSpec && logs.length === 0) {
    return null;
  }

  // Handle export button click
  const onExportClick = () => {
    handleExport(selectedBuild, user);
  };

  // Handle preview button click
  const onPreviewClick = () => {
    // Update iframe source if available
    if (selectedBuild?.previewUrl && iframeRef.current) {
      iframeRef.current.src = selectedBuild.previewUrl;
    }
    
    handlePreview(selectedBuild, user);
  };

  // Handle deploy button click
  const onDeployClick = () => {
    handleDeploy(selectedBuild, user);
  };

  // Check if the preview URL exists
  const hasPreviewUrl = Boolean(selectedBuild?.previewUrl);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {selectedBuild ? selectedBuild.appName : 'Build Results'}
            </CardTitle>
            <CardDescription>
              {selectedBuild 
                ? `App generated from prompt: ${selectedBuild.prompt.substring(0, 100)}${selectedBuild.prompt.length > 100 ? '...' : ''}`
                : 'App generated from your prompt'
              }
            </CardDescription>
          </div>
          {selectedBuild && selectedBuild.status === 'complete' && (
            <div className="flex space-x-2">
              <Badge variant="success">Build Complete</Badge>
              {hasPreviewUrl && <Badge variant="outline">Preview Available</Badge>}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <BuildResultTabs 
          spec={spec} 
          code={code}
          logs={logs} 
          previewUrl={selectedBuild?.previewUrl} 
          iframeRef={iframeRef}
          isLoadingSpec={isLoadingSpec}
          isLoadingCode={isLoadingCode}
          isLoadingPreview={isLoadingPreview}
          onContinueToBuild={onContinueToBuild}
          autoBuild={autoBuild}
        />
      </CardContent>
      
      {(isComplete || selectedBuild?.status === 'complete') && (
        <CardFooter>
          <BuildControls 
            selectedBuild={selectedBuild}
            isExporting={isExporting}
            isPreviewLoading={isPreviewLoading}
            isDeploying={isDeploying}
            onExport={onExportClick}
            onPreview={onPreviewClick}
            onDeploy={onDeployClick}
            hasPreview={hasPreviewUrl}
            autoBuild={autoBuild}
            onAutoBuildChange={onAutoBuildChange}
          />
        </CardFooter>
      )}
    </Card>
  );
};

export default BuildPreview;
