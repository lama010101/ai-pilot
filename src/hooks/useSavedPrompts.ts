
import { useState, useEffect } from 'react';

// Type for saved prompt
export interface SavedPrompt {
  id: string;
  text: string;
  timestamp: string;
}

export const useSavedPrompts = () => {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  
  // Load saved prompts from localStorage on component mount
  useEffect(() => {
    const storedPrompts = localStorage.getItem('savedPrompts');
    if (storedPrompts) {
      try {
        setSavedPrompts(JSON.parse(storedPrompts));
      } catch (error) {
        console.error('Error parsing saved prompts:', error);
        localStorage.removeItem('savedPrompts');
      }
    }
  }, []);
  
  // Save prompts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedPrompts', JSON.stringify(savedPrompts));
  }, [savedPrompts]);
  
  // Add a new prompt
  const savePrompt = (text: string) => {
    // Don't save empty prompts
    if (!text.trim()) return;
    
    // Don't save duplicate prompts
    if (savedPrompts.some(p => p.text === text)) return;
    
    const newPrompt: SavedPrompt = {
      id: crypto.randomUUID(),
      text,
      timestamp: new Date().toISOString()
    };
    
    setSavedPrompts(prev => [newPrompt, ...prev]);
  };
  
  // Remove a prompt by id
  const removePrompt = (id: string) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };
  
  // Clear all prompts
  const clearAllPrompts = () => {
    setSavedPrompts([]);
  };

  // Get sorted prompts (latest first)
  const getSortedPrompts = () => {
    return [...savedPrompts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };
  
  return {
    savedPrompts,
    getSortedPrompts,
    savePrompt,
    removePrompt,
    clearAllPrompts
  };
};

export default useSavedPrompts;
