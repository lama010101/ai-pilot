
import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { AppBuild } from '@/types/supabase';
import BuildHistoryEntry from './BuildHistoryEntry';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BuildHistoryListProps {
  builds: AppBuild[];
  onViewBuild: (build: AppBuild) => void;
  onRemixBuild: (build: AppBuild) => void;
  isLoading: boolean;
  currentBuildId?: string | null;
  expandedBuildIds: string[];
  onToggleBuildExpansion: (buildId: string) => void;
}

const BuildHistoryList: React.FC<BuildHistoryListProps> = ({ 
  builds, 
  onViewBuild, 
  onRemixBuild, 
  isLoading,
  currentBuildId,
  expandedBuildIds,
  onToggleBuildExpansion
}) => {
  const toggleAllExpansion = (expand: boolean) => {
    if (expand) {
      // Expand all builds
      const allBuildIds = builds.map(build => build.id);
      allBuildIds.forEach(id => {
        if (!expandedBuildIds.includes(id)) {
          onToggleBuildExpansion(id);
        }
      });
    } else {
      // Collapse all builds
      expandedBuildIds.forEach(id => {
        onToggleBuildExpansion(id);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
        <span className="ml-2">Loading build history...</span>
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No build history yet. Create your first app!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => toggleAllExpansion(true)}
          className="flex items-center gap-1"
        >
          <ChevronDown className="h-4 w-4" />
          Expand All
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => toggleAllExpansion(false)}
          className="flex items-center gap-1"
        >
          <ChevronUp className="h-4 w-4" />
          Collapse All
        </Button>
      </div>
      
      <div className="space-y-2">
        {builds.map((build) => (
          <BuildHistoryEntry
            key={build.id}
            build={build}
            onViewBuild={onViewBuild}
            onRemixBuild={onRemixBuild}
            isSelected={build.id === currentBuildId}
            isExpanded={expandedBuildIds.includes(build.id)}
            onToggleExpand={() => onToggleBuildExpansion(build.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default BuildHistoryList;
