
import React from 'react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppBuild } from '@/types/supabase';
import { formatDistance } from 'date-fns';
import { Check, AlertTriangle, X, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuildHistoryEntryProps {
  build: AppBuild;
  onViewBuild: (build: AppBuild) => void;
  onRemixBuild: (build: AppBuild) => void;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const BuildHistoryEntry: React.FC<BuildHistoryEntryProps> = ({
  build,
  onViewBuild,
  onRemixBuild,
  isSelected,
  isExpanded,
  onToggleExpand
}) => {
  // Determine badge variant based on build status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'processing':
        return 'default';
      case 'waiting':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get status icon based on build status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'waiting':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggleExpand}
      className={cn(
        "border rounded-md mb-2 overflow-hidden",
        isSelected ? "border-primary" : "border-border",
        build.status === 'complete' ? "border-green-200 bg-green-50/30" :
        build.status === 'failed' ? "border-red-200 bg-red-50/30" :
        "border-amber-200 bg-amber-50/30"
      )}
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50">
          <div className="flex items-center gap-2">
            {getStatusIcon(build.status)}
            <span className="font-medium">{build.appName}</span>
            <Badge variant={getBadgeVariant(build.status)}>
              {build.status.charAt(0).toUpperCase() + build.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatDistance(new Date(build.timestamp), new Date(), { addSuffix: true })}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium">Prompt:</p>
            <p className="text-sm text-muted-foreground break-words">
              {build.prompt}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onRemixBuild(build)}
            >
              Remix
            </Button>
            <Button 
              variant={isSelected ? "secondary" : "default"} 
              size="sm" 
              onClick={() => onViewBuild(build)}
            >
              {isSelected ? "Selected" : "View"}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BuildHistoryEntry;
