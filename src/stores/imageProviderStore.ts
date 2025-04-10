
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiKey } from '@/lib/apiKeyService';

export type ImageProvider = 'dalle' | 'midjourney' | 'vertex' | 'luma';

interface ImageProviderState {
  provider: ImageProvider;
  setProvider: (provider: ImageProvider) => void;
  providerStatus: Record<ImageProvider, boolean | null>;
  checkProviderStatus: (provider?: ImageProvider) => Promise<void>;
  isCheckingStatus: boolean;
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
      isCheckingStatus: false,
      
      setProvider: (provider) => set({ provider }),
      
      checkProviderStatus: async (provider) => {
        try {
          set({ isCheckingStatus: true });
          
          const providersToCheck = provider ? [provider] : ['dalle', 'midjourney', 'vertex', 'luma'] as ImageProvider[];
          const newStatus = { ...get().providerStatus };
          
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
                // Check both API key and project ID for Vertex
                hasKey = (await getApiKey('VERTEX_AI_API_KEY') !== null) && 
                         (await getApiKey('VERTEX_PROJECT_ID') !== null);
                break;
              case 'luma':
                hasKey = await getApiKey('LUMA_API_KEY') !== null;
                break;
            }
            
            newStatus[p] = hasKey;
          }
          
          set({ providerStatus: newStatus });
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
