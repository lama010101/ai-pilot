
import { toast as sonnerToast } from "sonner";

// Export the Sonner toast function with our custom defaults
export const toast = sonnerToast;

// Create empty useToast hook for compatibility
export const useToast = () => {
  return {
    toast: sonnerToast,
    toasts: [],
    dismiss: (id?: string) => {},
  };
};
