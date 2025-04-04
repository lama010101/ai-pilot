
import { useState } from 'react';
import { AppBuild } from '@/types/supabase';

export function useAppBuilderState() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [spec, setSpec] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [selectedBuild, setSelectedBuild] = useState<AppBuild | null>(null);
  const [promptInputValue, setPromptInputValue] = useState<string>('');
  const [buildError, setBuildError] = useState<string | null>(null);

  return {
    // Build process state
    isProcessing,
    setIsProcessing,
    currentStep,
    setCurrentStep,
    
    // Build output state
    spec,
    setSpec,
    code,
    setCode,
    isComplete,
    setIsComplete,
    
    // Current build state
    selectedBuild,
    setSelectedBuild,
    
    // UI state
    promptInputValue,
    setPromptInputValue,
    buildError,
    setBuildError
  };
}
