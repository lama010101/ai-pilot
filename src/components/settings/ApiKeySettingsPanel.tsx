import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { saveApiKey, getApiKey, testApiKey, saveVertexAICredentials } from '@/lib/apiKeyService';
import { useImageProviderStore } from '@/stores/imageProviderStore';

const ApiKeySettingsPanel = () => {
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [midjourneyKey, setMidjourneyKey] = useState<string>('');
  const [vertexKey, setVertexKey] = useState<string>('');
  const [vertexProjectId, setVertexProjectId] = useState<string>('');
  
  const [showOpenAI, setShowOpenAI] = useState<boolean>(false);
  const [showMidjourney, setShowMidjourney] = useState<boolean>(false);
  const [showVertex, setShowVertex] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  
  const { checkProviderStatus } = useImageProviderStore();

  // Load existing keys
  useEffect(() => {
    const loadKeys = async () => {
      try {
        setIsLoading(true);
        
        // Get OpenAI API key
        const openai = await getApiKey('OPENAI_API_KEY');
        if (openai) {
          setOpenaiKey('************');
        }
        
        // Get Midjourney API key
        const midjourney = await getApiKey('MIDJOURNEY_API_KEY');
        if (midjourney) {
          setMidjourneyKey('************');
        }
        
        // Get Vertex AI keys
        const vertex = await getApiKey('VERTEX_AI_API_KEY');
        const vertexProject = await getApiKey('VERTEX_PROJECT_ID');
        
        if (vertex) {
          setVertexKey('************');
        }
        
        if (vertexProject) {
          setVertexProjectId(vertexProject);
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
        toast.error('Failed to load API keys');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadKeys();
  }, []);

  const handleSaveKey = async (keyType: string) => {
    setIsSaving({ ...isSaving, [keyType]: true });
    
    try {
      let success = false;
      
      switch (keyType) {
        case 'openai':
          // Don't save if masked value or empty
          if (openaiKey === '************' || !openaiKey) {
            toast.info('No changes to OpenAI API key');
            return;
          }
          success = await saveApiKey('OPENAI_API_KEY', openaiKey);
          break;
          
        case 'midjourney':
          // Don't save if masked value or empty
          if (midjourneyKey === '************' || !midjourneyKey) {
            toast.info('No changes to Midjourney API key');
            return;
          }
          success = await saveApiKey('MIDJOURNEY_API_KEY', midjourneyKey);
          break;
          
        case 'vertex':
          // Don't save if both values are masked/unchanged
          if ((vertexKey === '************' || !vertexKey) && 
              (!vertexProjectId || vertexProjectId === await getApiKey('VERTEX_PROJECT_ID'))) {
            toast.info('No changes to Vertex AI credentials');
            return;
          }
          
          // If the API key is masked (unchanged) but project ID changed
          if (vertexKey === '************') {
            // Just update the project ID
            success = await saveApiKey('VERTEX_PROJECT_ID', vertexProjectId);
          } else {
            // Save both the API key and project ID
            success = await saveVertexAICredentials(vertexKey, vertexProjectId);
          }
          break;
      }
      
      if (success) {
        toast.success(`${keyType.charAt(0).toUpperCase() + keyType.slice(1)} API key saved successfully`);
        
        // Recheck provider status to update UI
        await checkProviderStatus();
        
        // Mask the key after saving for security
        if (keyType === 'openai') {
          setOpenaiKey('************');
        } else if (keyType === 'midjourney') {
          setMidjourneyKey('************');
        } else if (keyType === 'vertex') {
          setVertexKey('************');
        }
      } else {
        toast.error(`Failed to save ${keyType} API key`);
      }
    } catch (error) {
      console.error(`Error saving ${keyType} API key:`, error);
      toast.error(`Error saving ${keyType} API key`);
    } finally {
      setIsSaving({ ...isSaving, [keyType]: false });
    }
  };

  const handleTestConnection = async (provider: string) => {
    setIsTesting({ ...isTesting, [provider]: true });
    setTestResults({ ...testResults, [provider]: null });
    
    try {
      const result = await testApiKey(provider);
      setTestResults({ ...testResults, [provider]: result });
      
      if (result) {
        toast.success(`Successfully connected to ${provider}`);
      } else {
        toast.error(`Could not connect to ${provider}. Please check your API key.`);
      }
    } catch (error) {
      console.error(`Error testing ${provider} connection:`, error);
      setTestResults({ ...testResults, [provider]: false });
      toast.error(`Error testing ${provider} connection`);
    } finally {
      setIsTesting({ ...isTesting, [provider]: false });
    }
  };

  // Helper function to format provider names nicely
  const formatProviderName = (provider: string): string => {
    switch (provider) {
      case 'openai':
        return 'OpenAI (DALL·E)';
      case 'midjourney':
        return 'Midjourney';
      case 'vertex':
        return 'Vertex AI';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  // Choose which icon to show for test results
  const getTestResultIcon = (provider: string) => {
    if (testResults[provider] === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (testResults[provider] === false) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">API Key Settings</h2>
      <p className="text-muted-foreground">
        Configure API keys for various image generation services. Your keys are stored securely and never exposed to the frontend.
      </p>
      
      {/* OpenAI API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>OpenAI API Key</span>
            {getTestResultIcon('openai')}
          </CardTitle>
          <CardDescription>
            Used for DALL·E image generation. Get a key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI</a>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="openai-key">API Key</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="openai-key"
                  type={showOpenAI ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowOpenAI(!showOpenAI)}
                >
                  {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => handleSaveKey('openai')}
                disabled={isSaving.openai || !openaiKey}
              >
                {isSaving.openai ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => handleTestConnection('dalle')}
            disabled={isTesting.dalle}
            className="w-full"
          >
            {isTesting.dalle ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Google Vertex AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Google Vertex AI</span>
            {getTestResultIcon('vertex')}
          </CardTitle>
          <CardDescription>
            Used for Google's Imagen model. Get your API key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vertex-key">API Key</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="vertex-key"
                    type={showVertex ? "text" : "password"}
                    value={vertexKey}
                    onChange={(e) => setVertexKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowVertex(!showVertex)}
                  >
                    {showVertex ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vertex-project-id">Project ID</Label>
              <Input
                id="vertex-project-id"
                type="text"
                value={vertexProjectId}
                onChange={(e) => setVertexProjectId(e.target.value)}
                placeholder="my-project-123456"
              />
              <p className="text-xs text-muted-foreground">
                This is your Google Cloud project ID, not the project name. Find it in your Google Cloud Console.
              </p>
            </div>
            
            <Button
              onClick={() => handleSaveKey('vertex')}
              disabled={isSaving.vertex || (!vertexKey && !vertexProjectId)}
              className="w-full"
            >
              {isSaving.vertex ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Save Vertex AI Credentials'
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => handleTestConnection('vertex')}
            disabled={isTesting.vertex}
            className="w-full"
          >
            {isTesting.vertex ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Midjourney API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Midjourney API Key</span>
            {getTestResultIcon('midjourney')}
          </CardTitle>
          <CardDescription>
            Used for Midjourney image generation. Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="midjourney-key">API Key</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="midjourney-key"
                  type={showMidjourney ? "text" : "password"}
                  value={midjourneyKey}
                  onChange={(e) => setMidjourneyKey(e.target.value)}
                  placeholder="mj-..."
                  className="pr-10"
                  disabled={true}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowMidjourney(!showMidjourney)}
                  disabled={true}
                >
                  {showMidjourney ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => handleSaveKey('midjourney')}
                disabled={true}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-amber-500 mt-2">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Midjourney integration coming soon. Not currently available.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => handleTestConnection('midjourney')}
            disabled={true}
            className="w-full"
          >
            Test Connection
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ApiKeySettingsPanel;
