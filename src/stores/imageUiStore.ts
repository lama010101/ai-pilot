
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ImageDB, ProcessedImage } from '@/types/supabase';

export type ImageTab = 'writer' | 'manual' | 'upload' | 'gallery';
export type GallerySubTab = 'review' | 'stored';

interface ImageUiState {
  // Active tabs
  activeTab: ImageTab;
  gallerySubTab: GallerySubTab;
  
  // Images state
  processedImages: ProcessedImage[];
  generatedImage: any | null;
  
  // Set actions
  setActiveTab: (tab: ImageTab) => void;
  setGallerySubTab: (tab: GallerySubTab) => void;
  setProcessedImages: (images: ProcessedImage[]) => void;
  addProcessedImage: (image: ProcessedImage) => void;
  updateProcessedImage: (index: number, updates: Partial<ProcessedImage>) => void;
  removeProcessedImage: (index: number) => void;
  setGeneratedImage: (image: any | null) => void;
  
  // Reset actions
  resetAll: () => void;
}

const initialState = {
  activeTab: 'writer' as ImageTab,
  gallerySubTab: 'review' as GallerySubTab,
  processedImages: [] as ProcessedImage[],
  generatedImage: null,
};

export const useImageUiStore = create<ImageUiState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setActiveTab: (tab: ImageTab) => set({ activeTab: tab }),
      setGallerySubTab: (tab: GallerySubTab) => set({ gallerySubTab: tab }),
      setProcessedImages: (images: ProcessedImage[]) => set({ processedImages: images }),
      addProcessedImage: (image: ProcessedImage) => 
        set((state) => ({ 
          processedImages: [...state.processedImages, image] 
        })),
      updateProcessedImage: (index: number, updates: Partial<ProcessedImage>) => 
        set((state) => {
          const newImages = [...state.processedImages];
          if (newImages[index]) {
            newImages[index] = { ...newImages[index], ...updates };
          }
          return { processedImages: newImages };
        }),
      removeProcessedImage: (index: number) => 
        set((state) => ({
          processedImages: state.processedImages.filter((_, i) => i !== index)
        })),
      setGeneratedImage: (image: any | null) => set({ generatedImage: image }),
      resetAll: () => set(initialState),
    }),
    {
      name: 'image-ui-storage',
    }
  )
);
