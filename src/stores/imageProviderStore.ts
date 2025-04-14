
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiKey, isVertexAIConfigured, getVertexAIJsonStatus } from '@/lib/apiKeyService';

export type ImageProvider = 'dalle' | 'midjourney' | 'vertex' | 'luma';

interface ImageProviderState {
  provider: ImageProvider;
  setProvider: (provider: ImageProvider) => void;
  providerStatus: Record<ImageProvider, boolean | null>;
  providerAuthMethod: Record<string, string | null>;
  checkProviderStatus: (provider?: ImageProvider) => Promise<void>;
  isCheckingStatus: boolean;
  updateProviderStatus: (statuses: Record<ImageProvider, boolean>) => void;
  updateProviderAuthMethod: (provider: string, method: string) => void;
}

export const useImageProviderStore = create<ImageProviderState>()(
  persist(
    (set, get) => ({
      provider: 'dalle',
      providerStatus: {
        dalle: null,
        midjourney: null,
        vertex: null,
        luma: null
      },
      providerAuthMethod: {
        vertex: null
      },
      isCheckingStatus: false,
      
      setProvider: (provider) => set({ provider }),
      
      updateProviderStatus: (statuses) => {
        set({ providerStatus: { ...get().providerStatus, ...statuses } });
      },
      
      updateProviderAuthMethod: (provider, method) => {
        set({ 
          providerAuthMethod: { 
            ...get().providerAuthMethod, 
            [provider]: method 
          } 
        });
      },
      
      checkProviderStatus: async (provider) => {
        try {
          set({ isCheckingStatus: true });
          
          const providersToCheck = provider ? [provider] : ['dalle', 'midjourney', 'vertex', 'luma'] as ImageProvider[];
          const newStatus = { ...get().providerStatus };
          const newAuthMethods = { ...get().providerAuthMethod };
          
          for (const p of providersToCheck) {
            let hasKey = false;
            
            // Check if keys exist based on provider
            switch (p) {
              case 'dalle':
                hasKey = await getApiKey('OPENAI_API_KEY') !== null;
                break;
              case 'midjourney':
                hasKey = await getApiKey('MIDJOURNEY_API_KEY') !== null;
                break;
              case 'vertex':
                // Check if Vertex AI is configured (JSON or API key)
                hasKey = await isVertexAIConfigured();
                
                // Check which auth method is being used
                const jsonStatus = await getVertexAIJsonStatus();
                if (jsonStatus.exists) {
                  newAuthMethods.vertex = 'JSON';
                } else {
                  // Using API key method
                  const hasApiKey = await getApiKey('VERTEX_AI_API_KEY') !== null;
                  const hasProjectId = await getApiKey('VERTEX_PROJECT_ID') !== null;
                  if (hasApiKey && hasProjectId) {
                    newAuthMethods.vertex = 'API Key';
                  }
                }
                break;
              case 'luma':
                hasKey = await getApiKey('LUMA_API_KEY') !== null;
                break;
            }
            
            newStatus[p] = hasKey;
          }
          
          set({ 
            providerStatus: newStatus,
            providerAuthMethod: newAuthMethods
          });
        } catch (error) {
          console.error('Error checking provider status:', error);
        } finally {
          set({ isCheckingStatus: false });
        }
      }
    }),
    {
      name: 'image-provider-storage',
    }
  )
);
