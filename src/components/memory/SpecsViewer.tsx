
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clipboard, Download } from 'lucide-react';
import { useBuildHistory } from '@/hooks/useBuildHistory';

const SpecsViewer: React.FC = () => {
  const { appBuilds, fetchBuildHistory } = useBuildHistory();
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [spec, setSpec] = useState<string>('');
  
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
  
  // Get spec for the selected build
  useEffect(() => {
    if (selectedBuildId) {
      // Try to get spec from localStorage first
      try {
        const storedBuild = localStorage.getItem(`build_${selectedBuildId}`);
        if (storedBuild) {
          const buildData = JSON.parse(storedBuild);
          if (buildData.spec) {
            setSpec(buildData.spec);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading spec from storage:', error);
      }
      
      // If no spec found in localStorage, set empty spec
      setSpec('');
    }
  }, [selectedBuildId]);
  
  const copySpec = () => {
    navigator.clipboard.writeText(spec)
      .then(() => {
        console.log('Spec copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy spec:', err);
      });
  };
  
  const downloadSpec = () => {
    const blob = new Blob([spec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spec_${selectedBuildId}_${new Date().toISOString()}.md`;
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
            <SelectValue placeholder="Select a build to view specification" />
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
            onClick={copySpec} 
            disabled={!spec}
            className="flex items-center gap-1"
          >
            <Clipboard className="h-4 w-4" />
            Copy Spec
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadSpec} 
            disabled={!spec}
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
            {spec ? (
              <pre className="whitespace-pre-wrap">
                {spec}
              </pre>
            ) : (
              <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                {selectedBuildId ? 'No specification found for this build' : 'Select a build to view specification'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecsViewer;
