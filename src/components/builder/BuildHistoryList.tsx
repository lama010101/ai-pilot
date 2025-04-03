
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
import { Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AppBuild } from '@/types/supabase';
import { Skeleton } from "@/components/ui/skeleton";

interface BuildHistoryListProps {
  builds: AppBuild[];
  onViewBuild: (build: AppBuild) => void;
  isLoading?: boolean;
}

const BuildHistoryList: React.FC<BuildHistoryListProps> = ({ 
  builds, 
  onViewBuild, 
  isLoading = false 
}) => {
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
          <TableRow key={build.id}>
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
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onViewBuild(build)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BuildHistoryList;
