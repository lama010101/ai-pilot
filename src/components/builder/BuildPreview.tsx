
import React, { useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Code2, Eye, Table, Rocket } from 'lucide-react';
import { AppBuild } from '@/types/supabase';
import { toast } from "sonner";

interface BuildPreviewProps {
  spec: string;
  code: string;
  isComplete: boolean;
  selectedBuild: AppBuild | null;
}

const BuildPreview: React.FC<BuildPreviewProps> = ({ 
  spec, 
  code, 
  isComplete, 
  selectedBuild 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDeploy = () => {
    toast.info('Deployment in progress! Your app will be available shortly.');
    
    setTimeout(() => {
      toast.success('App deployed successfully! You can access it at the production URL.');
    }, 3000);
  };

  if (!spec && !code && !isComplete && !selectedBuild) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedBuild ? selectedBuild.appName : 'Build Results'}
        </CardTitle>
        <CardDescription>
          {selectedBuild 
            ? `App generated from prompt: ${selectedBuild.prompt.substring(0, 100)}${selectedBuild.prompt.length > 100 ? '...' : ''}`
            : 'App generated from your prompt'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              {selectedBuild?.previewUrl ? (
                <div className="w-full h-full border border-border rounded">
                  <iframe 
                    ref={iframeRef}
                    className="w-full h-full"
                    title="App Preview"
                    src="about:blank"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Table className="h-12 w-12 mb-2 mx-auto opacity-50" />
                  <p>Preview will be available after build completes.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {(isComplete || selectedBuild?.status === 'complete') && (
        <CardFooter>
          <Button 
            onClick={handleDeploy}
            className="flex items-center gap-2 ml-auto"
            variant="default"
          >
            <Rocket className="h-4 w-4" />
            Deploy App
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default BuildPreview;
