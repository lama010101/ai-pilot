import { supabase } from "@/lib/supabaseClient";

// Save API key securely
export const saveApiKey = async (keyName: string, value: string): Promise<boolean> => {
  try {
    // Skip saving empty values
    if (!value.trim()) {
      console.log(`Skipping empty key for ${keyName}`);
      return true;
    }
    
    // First try to get the existing record
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key_name', keyName)
      .single();
      
    if (existingKey) {
      // Update existing key
      const { error } = await supabase
        .from('api_keys')
        .update({ 
          key_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('key_name', keyName);
        
      if (error) throw error;
    } else {
      // Insert new key
      const { error } = await supabase
        .from('api_keys')
        .insert({ 
          key_name: keyName,
          key_value: value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

// Get API key securely
export const getApiKey = async (keyName: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('key_name', keyName)
      .maybeSingle();
      
    if (error) throw error;
    
    return data?.key_value || null;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
};

// Test API connection
export const testApiKey = async (providerId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/test-provider-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider: providerId }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error testing API connection:', error);
    return false;
  }
};

// Add a specific function for Vertex AI that requires both API key and project ID
export const saveVertexAICredentials = async (apiKey: string, projectId: string): Promise<boolean> => {
  try {
    // Save API key
    const apiKeyResult = await saveApiKey('VERTEX_AI_API_KEY', apiKey);
    
    // Save Project ID
    const projectIdResult = await saveApiKey('VERTEX_PROJECT_ID', projectId);
    
    return apiKeyResult && projectIdResult;
  } catch (error) {
    console.error('Error saving Vertex AI credentials:', error);
    return false;
  }
};

// Add a function to check if Vertex AI is fully configured
export const isVertexAIConfigured = async (): Promise<boolean> => {
  try {
    const apiKey = await getApiKey('VERTEX_AI_API_KEY');
    const projectId = await getApiKey('VERTEX_PROJECT_ID');
    
    return !!apiKey && !!projectId;
  } catch (error) {
    console.error('Error checking Vertex AI configuration:', error);
    return false;
  }
};
