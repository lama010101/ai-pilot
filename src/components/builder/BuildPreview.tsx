
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppBuild } from '@/types/supabase';
import BuildResultTabs from './BuildResultTabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Copy, Clipboard } from 'lucide-react';

interface BuildPreviewProps {
  spec?: string;
  code?: string;
  logs: string[];
  isComplete: boolean;
  isLoadingSpec: boolean;
  isLoadingCode: boolean;
  isLoadingPreview: boolean;
  selectedBuild: AppBuild | null;
  onContinueToBuild?: () => void;
  autoBuild: boolean;
  onAutoBuildChange: (value: boolean) => void;
  showFullLogs?: boolean;
  onCopyLogs?: () => void;
  onToggleFullLogs?: () => void;
}

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
  onAutoBuildChange,
  showFullLogs = false,
  onCopyLogs,
  onToggleFullLogs
}) => {
  const logsRef = useRef<HTMLDivElement>(null);
  const [specExpanded, setSpecExpanded] = React.useState(true);
  const [codeExpanded, setCodeExpanded] = React.useState(true);
  const [logsExpanded, setLogsExpanded] = React.useState(true);
  
  // Auto-scroll to bottom of logs when they update
  useEffect(() => {
    if (logsRef.current && logsExpanded) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs, logsExpanded]);
  
  if (!spec && !code && logs.length === 0 && !selectedBuild) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {spec && (
        <Collapsible open={specExpanded} onOpenChange={setSpecExpanded}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Application Specification</CardTitle>
                  <CardDescription>
                    AI-generated app specification
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {specExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <BuildResultTabs 
                  spec={spec}
                  code=""
                  logs={[]}
                  isLoadingSpec={isLoadingSpec}
                  isLoadingCode={false}
                  iframeRef={null}
                  isLoadingPreview={false}
                  autoBuild={autoBuild}
                />
                
                {onContinueToBuild && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-build"
                        checked={autoBuild}
                        onChange={(e) => onAutoBuildChange(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="auto-build" className="text-sm text-muted-foreground">
                        Automatically build after generating spec
                      </label>
                    </div>
                    <Button onClick={onContinueToBuild}>Continue to Build</Button>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
      
      {code && (
        <Collapsible open={codeExpanded} onOpenChange={setCodeExpanded}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Code</CardTitle>
                  <CardDescription>
                    AI-generated application code
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {codeExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <BuildResultTabs 
                  spec=""
                  code={code}
                  logs={[]}
                  isLoadingSpec={false}
                  isLoadingCode={isLoadingCode}
                  iframeRef={null}
                  isLoadingPreview={false}
                  autoBuild={autoBuild}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
      
      {logs.length > 0 && (
        <Collapsible open={logsExpanded} onOpenChange={setLogsExpanded}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Build Logs</CardTitle>
                  <CardDescription>
                    Build process logs and messages
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {onCopyLogs && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onCopyLogs}
                      className="flex items-center gap-1"
                    >
                      <Clipboard size={14} />
                      Copy Logs
                    </Button>
                  )}
                  {onToggleFullLogs && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onToggleFullLogs}
                      className="flex items-center gap-1"
                    >
                      {showFullLogs ? "Show Recent" : "Show All"}
                    </Button>
                  )}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {logsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div 
                  ref={logsRef}
                  className="bg-muted rounded p-4 h-64 overflow-y-auto font-mono text-sm"
                >
                  <pre className="whitespace-pre-wrap">
                    {logs.join('\n')}
                  </pre>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
      
      {selectedBuild?.previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              Preview of "{selectedBuild.appName}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full border rounded-md overflow-hidden">
              <iframe 
                src={selectedBuild.previewUrl} 
                title="App Preview"
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuildPreview;
