
import React from 'react';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatDistance } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Eye, Share2, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AppBuild } from '@/types/supabase';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BuildHistoryListProps {
  builds: AppBuild[];
  onViewBuild: (build: AppBuild) => void;
  onRemixBuild?: (build: AppBuild) => void;
  isLoading?: boolean;
  currentBuildId?: string;
}

const BuildHistoryList: React.FC<BuildHistoryListProps> = ({ 
  builds, 
  onViewBuild, 
  onRemixBuild,
  isLoading = false,
  currentBuildId
}) => {
  // Function to copy share link to clipboard
  const handleShareBuild = (buildId: string) => {
    const shareUrl = `${window.location.origin}/builder?id=${buildId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Share link copied to clipboard!");
      })
      .catch((error) => {
        console.error("Failed to copy link:", error);
        toast.error("Failed to copy link");
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
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
    <Table>
      <TableCaption>Your recent app builds</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>App Name</TableHead>
          <TableHead>Prompt</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {builds.map((build) => (
          <TableRow 
            key={build.id}
            className={currentBuildId === build.id ? "bg-muted/30" : ""}
          >
            <TableCell className="font-medium">{build.appName}</TableCell>
            <TableCell className="max-w-xs truncate">
              {build.prompt}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  build.status === 'complete' ? 'success' :
                  build.status === 'processing' ? 'default' :
                  'destructive'
                }
              >
                {build.status.charAt(0).toUpperCase() + build.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              {formatDistance(new Date(build.timestamp), new Date(), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-right space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onViewBuild(build)}
                title="View build"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShareBuild(build.id)}
                title="Share build"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              {onRemixBuild && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemixBuild(build)}
                  title="Remix this app"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BuildHistoryList;
