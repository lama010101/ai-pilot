
import React, { useRef, useState } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { FileText, Code2, Eye, Table, Rocket, Download, ExternalLink } from 'lucide-react';
import { AppBuild } from '@/types/supabase';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { exportBuild, triggerHostingPreview } from '@/lib/buildService';

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
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleExport = async () => {
    if (!selectedBuild || !user) {
      toast.error('Unable to export build', { description: 'Build information or user data is missing' });
      return;
    }
    
    if (!selectedBuild.id) {
      toast.error('Unable to export build', { description: 'Build ID is missing' });
      return;
    }
    
    setIsExporting(true);
    
    try {
      const { downloadUrl, fileName, error } = await exportBuild(selectedBuild.id, user.id);
      
      if (error) throw error;
      
      // Create a link element and trigger the download
      if (downloadUrl && fileName) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Build exported successfully!');
      } else {
        throw new Error('Download URL or filename not provided');
      }
    } catch (error) {
      console.error('Error exporting build:', error);
      toast.error(`Export failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedBuild || !user) {
      toast.error('Unable to preview build', { description: 'Build information or user data is missing' });
      return;
    }
    
    if (!selectedBuild.id) {
      toast.error('Unable to preview build', { description: 'Build ID is missing' });
      return;
    }
    
    setIsPreviewLoading(true);
    
    try {
      const { previewUrl, error } = await triggerHostingPreview(selectedBuild.id, user.id);
      
      if (error) throw error;
      
      if (previewUrl) {
        // Update iframe source if available
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl;
        }
        
        // Open in new tab
        window.open(previewUrl, '_blank');
        
        toast.success('Preview deployed successfully!');
      } else {
        throw new Error('Preview URL not provided');
      }
    } catch (error) {
      console.error('Error deploying preview:', error);
      toast.error(`Preview deployment failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Handler for deploying the app to production
  const handleDeploy = async () => {
    if (!selectedBuild || !user) {
      toast.error('Unable to deploy build', { description: 'Build information or user data is missing' });
      return;
    }
    
    if (!selectedBuild.id) {
      toast.error('Unable to deploy build', { description: 'Build ID is missing' });
      return;
    }
    
    setIsDeploying(true);
    
    try {
      // In a real implementation, this would call a deployment API
      // For now, we'll simulate a successful deployment
      toast.info('Deployment in progress! Your app will be available shortly.');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('App deployed successfully! You can access it at the production URL.');
    } catch (error) {
      console.error('Error deploying build:', error);
      toast.error(`Deployment failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  if (!spec && !code && !isComplete && !selectedBuild) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {selectedBuild ? selectedBuild.appName : 'Build Results'}
            </CardTitle>
            <CardDescription>
              {selectedBuild 
                ? `App generated from prompt: ${selectedBuild.prompt.substring(0, 100)}${selectedBuild.prompt.length > 100 ? '...' : ''}`
                : 'App generated from your prompt'
              }
            </CardDescription>
          </div>
          {selectedBuild && selectedBuild.status === 'complete' && (
            <div className="flex space-x-2">
              <Badge variant="success">Build Complete</Badge>
            </div>
          )}
        </div>
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
                    src={selectedBuild.previewUrl}
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
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={handleExport}
              className="flex items-center gap-2"
              variant="outline"
              disabled={isExporting}
            >
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Code
                </>
              )}
            </Button>
            
            <Button 
              onClick={handlePreview}
              className="flex items-center gap-2"
              variant="outline"
              disabled={isPreviewLoading}
            >
              {isPreviewLoading ? (
                <>Deploying Preview...</>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Live Preview
                </>
              )}
            </Button>
          </div>
          
          <Button 
            onClick={handleDeploy}
            className="flex items-center gap-2"
            variant="default"
            disabled={isDeploying}
          >
            {isDeploying ? (
              <>Deploying...</>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Deploy App
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default BuildPreview;
