
import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { AppBuild } from '@/types/supabase';
import BuildHistoryEntry from './BuildHistoryEntry';

interface BuildHistoryListProps {
  builds: AppBuild[];
  onViewBuild: (build: AppBuild) => void;
  onRemixBuild: (build: AppBuild) => void;
  isLoading: boolean;
  currentBuildId?: string | null;
  expandedBuildIds?: string[];
  onToggleBuildExpansion?: (buildId: string) => void;
}

const BuildHistoryList: React.FC<BuildHistoryListProps> = ({ 
  builds, 
  onViewBuild, 
  onRemixBuild, 
  isLoading,
  currentBuildId,
  expandedBuildIds = [],
  onToggleBuildExpansion = () => {}
}) => {
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
  );
};

export default BuildHistoryList;
