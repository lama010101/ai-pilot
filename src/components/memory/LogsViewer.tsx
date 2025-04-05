
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clipboard, Download } from 'lucide-react';
import { useBuildHistory } from '@/hooks/useBuildHistory';

const LogsViewer: React.FC = () => {
  const { appBuilds, fetchBuildHistory } = useBuildHistory();
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Load build history on mount
  useEffect(() => {
    fetchBuildHistory();
  }, [fetchBuildHistory]);
  
  // When builds are loaded, select the most recent one by default
  useEffect(() => {
    if (appBuilds.length > 0 && !selectedBuildId) {
      setSelectedBuildId(appBuilds[0].id);
    }
  }, [appBuilds, selectedBuildId]);
  
  // Get logs for the selected build
  useEffect(() => {
    if (selectedBuildId) {
      // Try to get logs from localStorage first
      try {
        const storedBuild = localStorage.getItem(`build_${selectedBuildId}`);
        if (storedBuild) {
          const buildData = JSON.parse(storedBuild);
          if (buildData.logs && buildData.logs.length > 0) {
            setLogs(buildData.logs);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading logs from storage:', error);
      }
      
      // If no logs found in localStorage, set empty logs
      setLogs([]);
    }
  }, [selectedBuildId]);
  
  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'))
      .then(() => {
        console.log('Logs copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy logs:', err);
      });
  };
  
  const downloadLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${selectedBuildId}_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={selectedBuildId || undefined} onValueChange={setSelectedBuildId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a build to view logs" />
          </SelectTrigger>
          <SelectContent>
            {appBuilds.map(build => (
              <SelectItem key={build.id} value={build.id}>
                {build.appName} - {new Date(build.timestamp).toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyLogs} 
            disabled={logs.length === 0}
            className="flex items-center gap-1"
          >
            <Clipboard className="h-4 w-4" />
            Copy Logs
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadLogs} 
            disabled={logs.length === 0}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="bg-muted rounded p-4 h-[500px] overflow-y-auto font-mono text-sm">
            {logs.length > 0 ? (
              <pre className="whitespace-pre-wrap">
                {logs.join('\n')}
              </pre>
            ) : (
              <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                {selectedBuildId ? 'No logs found for this build' : 'Select a build to view logs'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsViewer;
