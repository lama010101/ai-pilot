
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Code2, Eye, Table, ListFilter } from 'lucide-react';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface BuildResultTabsProps {
  spec: string;
  code: string;
  logs: string[];
  previewUrl?: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isLoadingSpec: boolean;
  isLoadingCode: boolean;
  isLoadingPreview: boolean;
  onContinueToBuild?: () => void;
  autoBuild: boolean;
}

/**
 * Component to display the build results in tabs (spec, code, preview, logs)
 */
const BuildResultTabs: React.FC<BuildResultTabsProps> = ({ 
  spec, 
  code, 
  logs,
  previewUrl,
  iframeRef,
  isLoadingSpec,
  isLoadingCode,
  isLoadingPreview,
  onContinueToBuild,
  autoBuild
}) => {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`${type} copied to clipboard`);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error(`Failed to copy ${type.toLowerCase()}`);
      });
  };

  return (
    <Tabs defaultValue="spec" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="spec" className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> Specification
        </TabsTrigger>
        <TabsTrigger value="code" className="flex items-center gap-2">
          <Code2 className="h-4 w-4" /> Code Preview
        </TabsTrigger>
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> App Preview
        </TabsTrigger>
        <TabsTrigger value="logs" className="flex items-center gap-2">
          <ListFilter className="h-4 w-4" /> Build Logs
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="spec" className="mt-4">
        <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px] relative">
          {isLoadingSpec ? (
            <div className="flex items-center justify-center h-[200px]">
              <Spinner />
              <span className="ml-2">Generating specification...</span>
            </div>
          ) : spec ? (
            <>
              <div className="absolute top-2 right-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(spec, "Specification")}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm pt-8">{spec}</pre>
              
              {!autoBuild && onContinueToBuild && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={onContinueToBuild}>
                    Continue to Code
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Waiting for specification to be generated...</p>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="code" className="mt-4">
        <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px] relative">
          {isLoadingCode ? (
            <div className="flex items-center justify-center h-[200px]">
              <Spinner />
              <span className="ml-2">Generating code...</span>
            </div>
          ) : code ? (
            <>
              <div className="absolute top-2 right-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(code, "Code")}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm pt-8">{code}</pre>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Code will appear here after specification is generated.</p>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="preview" className="mt-4">
        <div className="bg-card-foreground/5 rounded-md p-4 h-[400px] flex items-center justify-center">
          {isLoadingPreview ? (
            <div className="flex flex-col items-center justify-center">
              <Spinner />
              <span className="mt-2">Deploying preview...</span>
            </div>
          ) : previewUrl ? (
            <div className="w-full h-full border border-border rounded overflow-hidden">
              <iframe 
                ref={iframeRef}
                className="w-full h-full"
                title="App Preview"
                src={previewUrl}
                sandbox="allow-scripts allow-forms allow-same-origin"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Table className="h-12 w-12 mb-2 mx-auto opacity-50" />
              <p>Preview unavailable. You can still view the code and spec.</p>
              <p className="text-sm mt-2">The app needs to be successfully deployed to show a preview.</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="logs" className="mt-4">
        <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px] relative">
          <div className="absolute top-2 right-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(logs.join('\n'), "Logs")}
              disabled={logs.length === 0}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-sm pt-8">
            {logs.length > 0 ? logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Build logs will appear here during the build process.</p>
              </div>
            )}
          </pre>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default BuildResultTabs;
