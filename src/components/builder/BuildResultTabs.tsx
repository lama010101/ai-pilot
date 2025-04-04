
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Code2, Eye, Table } from 'lucide-react';

interface BuildResultTabsProps {
  spec: string;
  code: string;
  previewUrl?: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

/**
 * Component to display the build results in tabs (spec, code, preview)
 */
const BuildResultTabs: React.FC<BuildResultTabsProps> = ({ 
  spec, 
  code, 
  previewUrl,
  iframeRef
}) => {
  return (
    <Tabs defaultValue="spec" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="spec" className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> Specification
        </TabsTrigger>
        <TabsTrigger value="code" className="flex items-center gap-2">
          <Code2 className="h-4 w-4" /> Code Preview
        </TabsTrigger>
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> App Preview
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="spec" className="mt-4">
        <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px]">
          <pre className="whitespace-pre-wrap text-sm">{spec || "Specification will appear here after building."}</pre>
        </div>
      </TabsContent>
      
      <TabsContent value="code" className="mt-4">
        <div className="bg-card-foreground/5 rounded-md p-4 overflow-auto max-h-[400px]">
          <pre className="whitespace-pre-wrap text-sm">{code || "Code will appear here after building."}</pre>
        </div>
      </TabsContent>
      
      <TabsContent value="preview" className="mt-4">
        <div className="bg-card-foreground/5 rounded-md p-4 h-[400px] flex items-center justify-center">
          {previewUrl ? (
            <div className="w-full h-full border border-border rounded">
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
              <p>Preview will be available after build completes.</p>
              <p className="text-sm mt-2">The app preview will be deployed automatically and shown here.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default BuildResultTabs;
