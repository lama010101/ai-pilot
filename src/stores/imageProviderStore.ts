
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ImageProvider = 'dalle' | 'midjourney' | 'vertex';

interface ImageProviderState {
  provider: ImageProvider;
  setProvider: (provider: ImageProvider) => void;
}

export const useImageProviderStore = create<ImageProviderState>()(
  persist(
    (set) => ({
      provider: 'dalle',
      setProvider: (provider) => set({ provider }),
    }),
    {
      name: 'image-provider-storage',
    }
  )
);
