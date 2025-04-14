import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw, Check, AlertTriangle, Upload, X, FileText } from "lucide-react";
import { saveApiKey, getApiKey, testApiKey, saveVertexAICredentials, saveVertexAIJsonCredentials, getVertexAIJsonStatus } from '@/lib/apiKeyService';
import { useImageProviderStore } from '@/stores/imageProviderStore';
import { Textarea } from "@/components/ui/textarea";

const ApiKeySettingsPanel = () => {
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [midjourneyKey, setMidjourneyKey] = useState<string>('');
  const [vertexKey, setVertexKey] = useState<string>('');
  const [vertexProjectId, setVertexProjectId] = useState<string>('');
  const [vertexJsonFile, setVertexJsonFile] = useState<File | null>(null);
  const [vertexJsonFileStatus, setVertexJsonFileStatus] = useState<boolean>(false);
  const [vertexJsonFileName, setVertexJsonFileName] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const [showOpenAI, setShowOpenAI] = useState<boolean>(false);
  const [showMidjourney, setShowMidjourney] = useState<boolean>(false);
  const [showVertex, setShowVertex] = useState<boolean>(false);
  const [showVertexJson, setShowVertexJson] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const [testImages, setTestImages] = useState<Record<string, string | null>>({});
  
  const { checkProviderStatus } = useImageProviderStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
  };

  // Load existing keys
  useEffect(() => {
    const loadKeys = async () => {
      try {
        setIsLoading(true);
        addDebugLog('Loading API key configuration...');
        
        // Get OpenAI API key
        const openai = await getApiKey('OPENAI_API_KEY');
        if (openai) {
          setOpenaiKey('************');
          addDebugLog('OpenAI API key found');
        }
        
        // Get Midjourney API key
        const midjourney = await getApiKey('MIDJOURNEY_API_KEY');
        if (midjourney) {
          setMidjourneyKey('************');
          addDebugLog('Midjourney API key found');
        }
        
        // Get Vertex AI keys
        const vertex = await getApiKey('VERTEX_AI_API_KEY');
        const vertexProject = await getApiKey('VERTEX_PROJECT_ID');
        
        if (vertex) {
          setVertexKey('************');
          addDebugLog('Vertex AI API key found');
        }
        
        if (vertexProject) {
          setVertexProjectId(vertexProject);
          addDebugLog(`Vertex Project ID found: ${vertexProject}`);
        }

        // Check if Vertex JSON is stored
        const jsonStatus = await getVertexAIJsonStatus();
        if (jsonStatus.exists) {
          setVertexJsonFileStatus(true);
          setVertexJsonFileName(jsonStatus.filename || 'credentials.json');
          addDebugLog(`Vertex AI JSON credentials found: ${jsonStatus.filename}`);
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
        addDebugLog(`Error loading API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          addDebugLog('Saving OpenAI API key...');
          success = await saveApiKey('OPENAI_API_KEY', openaiKey);
          addDebugLog(success ? 'OpenAI API key saved successfully' : 'Failed to save OpenAI API key');
          break;
          
        case 'midjourney':
          // Don't save if masked value or empty
          if (midjourneyKey === '************' || !midjourneyKey) {
            toast.info('No changes to Midjourney API key');
            return;
          }
          addDebugLog('Saving Midjourney API key...');
          success = await saveApiKey('MIDJOURNEY_API_KEY', midjourneyKey);
          addDebugLog(success ? 'Midjourney API key saved successfully' : 'Failed to save Midjourney API key');
          break;
          
        case 'vertex':
          // If JSON file is provided, save it first
          if (vertexJsonFile) {
            addDebugLog(`Processing Vertex AI JSON file: ${vertexJsonFile.name}`);
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const jsonContent = e.target?.result as string;
                // Validate JSON format
                JSON.parse(jsonContent); // Will throw if invalid JSON
                
                // Save JSON credentials
                addDebugLog('Saving Vertex AI JSON credentials...');
                success = await saveVertexAIJsonCredentials(jsonContent, vertexJsonFile.name);
                
                if (success) {
                  addDebugLog('Vertex AI JSON credentials saved successfully');
                  setVertexJsonFileStatus(true);
                  setVertexJsonFileName(vertexJsonFile.name);
                  toast.success('Vertex AI JSON credentials saved');
                  
                  // Reset file input
                  setVertexJsonFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                  
                  // Check provider status
                  await checkProviderStatus('vertex');
                  
                  // Test the connection after saving
                  handleTestConnection('vertex');
                } else {
                  addDebugLog('Failed to save Vertex AI JSON credentials');
                  toast.error('Failed to save Vertex AI JSON credentials');
                }
              } catch (error) {
                console.error('Invalid JSON file:', error);
                addDebugLog(`Invalid JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                toast.error('Invalid JSON file. Please provide a valid Google Cloud credentials JSON file.');
              }
            };
            reader.readAsText(vertexJsonFile);
            setIsSaving({ ...isSaving, [keyType]: false });
            return;
          }
          
          // Handle API key + Project ID save
          // Don't save if both values are masked/unchanged
          if ((vertexKey === '************' || !vertexKey) && 
              (!vertexProjectId || vertexProjectId === await getApiKey('VERTEX_PROJECT_ID'))) {
            toast.info('No changes to Vertex AI credentials');
            return;
          }
          
          addDebugLog('Saving Vertex AI API key credentials...');
          
          // If the API key is masked (unchanged) but project ID changed
          if (vertexKey === '************') {
            // Just update the project ID
            success = await saveApiKey('VERTEX_PROJECT_ID', vertexProjectId);
            addDebugLog(success ? 'Vertex AI Project ID updated' : 'Failed to update Vertex AI Project ID');
          } else {
            // Save both the API key and project ID
            success = await saveVertexAICredentials(vertexKey, vertexProjectId);
            addDebugLog(success ? 'Vertex AI credentials (API key + Project ID) saved' : 'Failed to save Vertex AI credentials');
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

        // Test the connection automatically after saving
        handleTestConnection(keyType === 'vertex' ? 'vertex' : keyType === 'openai' ? 'dalle' : keyType);
      } else {
        toast.error(`Failed to save ${keyType} API key`);
      }
    } catch (error) {
      console.error(`Error saving ${keyType} API key:`, error);
      addDebugLog(`Error saving ${keyType} API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Error saving ${keyType} API key`);
    } finally {
      setIsSaving({ ...isSaving, [keyType]: false });
    }
  };

  const handleTestConnection = async (provider: string) => {
    setIsTesting({ ...isTesting, [provider]: true });
    setTestResults({ ...testResults, [provider]: null });
    setTestImages({ ...testImages, [provider]: null });
    
    try {
      addDebugLog(`Testing connection to ${provider}...`);
      
      // Test generating an actual image
      const testPrompt = "A scenic mountain landscape with a river";
      addDebugLog(`Using test prompt: "${testPrompt}"`);
      
      const testReq = {
        provider,
        testMode: true,
        prompt: testPrompt
      };
      
      const response = await fetch('/api/test-provider-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testReq),
      });
      
      const result = await response.json();
      const success = result.success;
      
      setTestResults({ ...testResults, [provider]: success });
      
      if (success) {
        addDebugLog(`Successfully connected to ${provider}`);
        
        // If image was generated, show it
        if (result.imageUrl) {
          setTestImages({ ...testImages, [provider]: result.imageUrl });
          addDebugLog(`Received test image from ${provider}`);
        }
        
        // Log auth method used
        if (result.authMethod) {
          addDebugLog(`Auth method used: ${result.authMethod}`);
        }
        
        toast.success(`Successfully connected to ${provider}`);
      } else {
        addDebugLog(`Connection to ${provider} failed: ${result.error || 'Unknown error'}`);
        toast.error(`Could not connect to ${provider}. ${result.error || 'Please check your API key.'}`);
      }
    } catch (error) {
      console.error(`Error testing ${provider} connection:`, error);
      addDebugLog(`Error testing ${provider} connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestResults({ ...testResults, [provider]: false });
      toast.error(`Error testing ${provider} connection`);
    } finally {
      setIsTesting({ ...isTesting, [provider]: false });
    }
  };

  const handleClearVertexJson = async () => {
    try {
      addDebugLog('Clearing Vertex AI JSON credentials...');
      const { error } = await fetch('/api/clear-vertex-json', {
        method: 'POST',
      }).then(res => res.json());
      
      if (error) {
        throw new Error(error);
      }
      
      setVertexJsonFileStatus(false);
      setVertexJsonFileName('');
      addDebugLog('Vertex AI JSON credentials cleared');
      toast.success('Vertex AI JSON credentials removed');
      
      // Recheck provider status
      await checkProviderStatus('vertex');
    } catch (error) {
      console.error('Error clearing Vertex JSON:', error);
      addDebugLog(`Error clearing Vertex JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to clear Vertex AI JSON credentials');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.json')) {
        setVertexJsonFile(file);
        addDebugLog(`Selected JSON file: ${file.name}`);
      } else {
        addDebugLog('Invalid file type - must be JSON');
        toast.error('Please select a valid JSON file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Helper function to format provider names nicely
  const formatProviderName = (provider: string): string => {
    switch (provider) {
      case 'openai':
        return 'OpenAI (DALL·E)';
      case 'dalle':
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
            {getTestResultIcon('dalle')}
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
          
          {testImages.dalle && (
            <div className="mt-4">
              <Label>Test Image</Label>
              <div className="mt-2 border rounded overflow-hidden">
                <img 
                  src={testImages.dalle} 
                  alt="Test DALL·E image" 
                  className="w-full h-auto max-h-[200px] object-contain"
                />
              </div>
            </div>
          )}
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
            Used for Google's Imagen model. Get your credentials from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* JSON Credentials File Upload */}
            <div className="space-y-2">
              <Label>JSON Credentials File (Recommended)</Label>
              <div className="space-y-2">
                {vertexJsonFileStatus ? (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="flex-1 truncate">
                      {showVertexJson ? vertexJsonFileName : '**********'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowVertexJson(!showVertexJson)}
                    >
                      {showVertexJson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={handleClearVertexJson}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      id="vertex-json"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {vertexJsonFile ? vertexJsonFile.name : 'Upload JSON Credentials'}
                    </Button>
                    {vertexJsonFile && (
                      <Button
                        onClick={() => handleSaveKey('vertex')}
                        disabled={isSaving.vertex}
                      >
                        {isSaving.vertex ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  This method is preferred and more secure. Upload your service account JSON credentials file from Google Cloud.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or use API Key method</span>
              </div>
            </div>
            
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
              disabled={isSaving.vertex || (!vertexKey && !vertexProjectId) || vertexJsonFileStatus}
              className="w-full"
            >
              {isSaving.vertex ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Save API Key & Project ID'
              )}
            </Button>
            
            {testImages.vertex && (
              <div className="mt-2">
                <Label>Test Image</Label>
                <div className="mt-2 border rounded overflow-hidden">
                  <img 
                    src={testImages.vertex} 
                    alt="Test Vertex AI image" 
                    className="w-full h-auto max-h-[200px] object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
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
          
          <div className="w-full">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Debug Logs
              </summary>
              <Textarea 
                className="mt-2 font-mono text-xs h-[200px]" 
                readOnly 
                value={debugLogs.join('\n')} 
              />
            </details>
          </div>
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
