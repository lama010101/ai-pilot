
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import { AlertCircle, EyeIcon, EyeOffIcon, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { providerConfigs } from '@/lib/providerConfig';
import { saveApiKey, getApiKey, testApiKey } from '@/lib/apiKeyService';

interface ProviderField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface Provider {
  id: string;
  name: string;
  description: string;
  fields: ProviderField[];
}

// Define providers with their required fields
const providers: Provider[] = [
  {
    id: 'dalle',
    name: 'DALL·E',
    description: 'OpenAI image generation service',
    fields: [
      {
        id: 'OPENAI_API_KEY',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-...',
        required: true
      }
    ]
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Midjourney image generation service',
    fields: [
      {
        id: 'MIDJOURNEY_API_KEY',
        label: 'API Key',
        type: 'password',
        placeholder: 'midjourney-...',
        required: true
      }
    ]
  },
  {
    id: 'vertex',
    name: 'Vertex AI',
    description: 'Google Cloud Vertex AI image generation service',
    fields: [
      {
        id: 'VERTEX_AI_API_KEY',
        label: 'API Key',
        type: 'password',
        placeholder: 'AIza...',
        required: true
      },
      {
        id: 'VERTEX_PROJECT_ID',
        label: 'Project ID',
        type: 'text',
        placeholder: 'my-project-id',
        required: true
      }
    ]
  }
];

const ApiKeysManager: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dalle');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  
  // Check if user is authorized (Leader email)
  useEffect(() => {
    const leaderEmail = import.meta.env.VITE_LEADER_EMAIL;
    if (isAuthenticated && user) {
      setIsAuthorized(user.email === leaderEmail);
    } else {
      setIsAuthorized(false);
    }
    setIsLoading(false);
  }, [isAuthenticated, user]);
  
  // Initialize field values and load existing keys
  useEffect(() => {
    if (!isAuthorized) return;
    
    const initialValues: Record<string, Record<string, string>> = {};
    const initialVisibility: Record<string, boolean> = {};
    
    providers.forEach(provider => {
      initialValues[provider.id] = {};
      provider.fields.forEach(field => {
        initialValues[provider.id][field.id] = '';
        initialVisibility[field.id] = false;
      });
    });
    
    setFieldValues(initialValues);
    setFieldVisibility(initialVisibility);
    
    // Load existing keys
    const loadKeys = async () => {
      const loadedValues = { ...initialValues };
      
      for (const provider of providers) {
        for (const field of provider.fields) {
          try {
            const value = await getApiKey(field.id);
            if (value) {
              loadedValues[provider.id][field.id] = value;
            }
          } catch (error) {
            console.error(`Error loading key for ${field.id}:`, error);
          }
        }
      }
      
      setFieldValues(loadedValues);
    };
    
    loadKeys();
  }, [isAuthorized]);
  
  // Handle field change
  const handleFieldChange = (providerId: string, fieldId: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [fieldId]: value
      }
    }));
  };
  
  // Toggle field visibility
  const toggleFieldVisibility = (fieldId: string) => {
    setFieldVisibility(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };
  
  // Save API keys for a provider
  const handleSave = async (providerId: string) => {
    try {
      setIsLoading(true);
      
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;
      
      for (const field of provider.fields) {
        const value = fieldValues[providerId][field.id];
        if (field.required && !value) {
          toast({
            title: "Validation Error",
            description: `${field.label} is required for ${provider.name}`,
            duration: 3000
          });
          setIsLoading(false);
          return;
        }
        
        await saveApiKey(field.id, value);
      }
      
      toast({
        title: "API Keys Saved",
        description: `${provider.name} API keys have been securely saved`,
        duration: 3000
      });
      
      // Reset test results for this provider
      setTestResults(prev => ({
        ...prev,
        [providerId]: null
      }));
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error Saving Keys",
        description: "There was an error saving your API keys. Please try again.",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test API connection
  const testConnection = async (providerId: string) => {
    try {
      setIsLoading(true);
      setTestResults(prev => ({
        ...prev,
        [providerId]: null
      }));
      
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;
      
      // Make sure all required fields are saved first
      for (const field of provider.fields) {
        if (field.required && !fieldValues[providerId][field.id]) {
          toast({
            title: "Missing Required Fields",
            description: `Please save ${provider.name} API keys before testing`,
            duration: 3000
          });
          setIsLoading(false);
          return;
        }
      }
      
      const result = await testApiKey(providerId);
      
      setTestResults(prev => ({
        ...prev,
        [providerId]: result
      }));
      
      toast({
        title: result ? "Connection Successful" : "Connection Failed",
        description: result 
          ? `Successfully connected to ${provider.name} API` 
          : `Failed to connect to ${provider.name} API. Please check your credentials`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error testing API connection:', error);
      setTestResults(prev => ({
        ...prev,
        [providerId]: false
      }));
      toast({
        title: "Connection Test Error",
        description: "There was an error testing the API connection. Please try again.",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Only the system Leader can access the API Keys Management. Please log in with the Leader account.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider API Keys</CardTitle>
        <CardDescription>
          Configure API keys for external services used by the AI Pilot system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {providers.map(provider => (
              <TabsTrigger key={provider.id} value={provider.id} className="relative">
                {provider.name}
                {testResults[provider.id] === true && (
                  <span className="absolute -top-1 -right-1">
                    <CheckCircle size={14} className="text-green-500" />
                  </span>
                )}
                {testResults[provider.id] === false && (
                  <span className="absolute -top-1 -right-1">
                    <XCircle size={14} className="text-red-500" />
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {providers.map(provider => (
            <TabsContent key={provider.id} value={provider.id} className="space-y-4">
              <div className="grid gap-4">
                <div className="text-sm text-muted-foreground mb-2">
                  {provider.description}
                </div>
                
                {provider.fields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={field.id}
                          type={fieldVisibility[field.id] ? 'text' : 'password'}
                          value={fieldValues[provider.id][field.id]}
                          onChange={(e) => handleFieldChange(provider.id, field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => toggleFieldVisibility(field.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {fieldVisibility[field.id] ? (
                            <EyeOffIcon size={16} />
                          ) : (
                            <EyeIcon size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleSave(provider.id)}
                    disabled={isLoading}
                  >
                    Save {provider.name} Keys
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testConnection(provider.id)}
                    disabled={isLoading}
                  >
                    Test Connection
                  </Button>
                </div>
                
                {testResults[provider.id] === true && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Successfully connected to the {provider.name} API service.
                    </AlertDescription>
                  </Alert>
                )}
                
                {testResults[provider.id] === false && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Connection Failed</AlertTitle>
                    <AlertDescription>
                      Failed to connect to the {provider.name} API. Please check your credentials and try again.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiKeysManager;
