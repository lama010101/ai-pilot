
export interface ProviderConfig {
  name: string;
  endpointUrl: string;
  keyRequired: boolean;
  keyName: string;
  defaultModel: string;
  maxPromptLength: number;
  models: string[];
  additionalFields?: string[];
}

export const providerConfigs: Record<string, ProviderConfig> = {
  dalle: {
    name: 'DALL·E',
    endpointUrl: 'https://api.openai.com/v1/images/generations',
    keyRequired: true,
    keyName: 'OPENAI_API_KEY',
    defaultModel: 'dall-e-3',
    maxPromptLength: 4000,
    models: ['dall-e-3', 'dall-e-2']
  },
  midjourney: {
    name: 'Midjourney',
    endpointUrl: 'https://api.midjourney.com/v1/generations',
    keyRequired: true,
    keyName: 'MIDJOURNEY_API_KEY',
    defaultModel: 'midjourney-5',
    maxPromptLength: 6000,
    models: ['midjourney-5', 'midjourney-4']
  },
  vertex: {
    name: 'Vertex AI',
    endpointUrl: 'https://us-central1-aiplatform.googleapis.com/v1/projects/{projectId}/locations/us-central1/publishers/google/models/imagegeneration:predict',
    keyRequired: true,
    keyName: 'VERTEX_AI_API_KEY',
    defaultModel: 'imagegeneration',
    maxPromptLength: 4000,
    models: ['imagegeneration'],
    additionalFields: ['VERTEX_PROJECT_ID']
  }
};

export const getProviderConfig = (provider: string): ProviderConfig => {
  const normalizedProvider = provider.toLowerCase();
  return providerConfigs[normalizedProvider] || providerConfigs.dalle;
};
