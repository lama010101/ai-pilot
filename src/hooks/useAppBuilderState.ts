
import { useState } from 'react';
import { AppBuild } from '@/types/supabase';

export function useAppBuilderState() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [spec, setSpec] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [selectedBuild, setSelectedBuild] = useState<AppBuild | null>(null);
  const [promptInputValue, setPromptInputValue] = useState<string>('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isLoadingSpec, setIsLoadingSpec] = useState<boolean>(false);
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [autoBuild, setAutoBuild] = useState<boolean>(true);
  const [expandedBuildIds, setExpandedBuildIds] = useState<string[]>([]);

  const toggleBuildExpansion = (buildId: string) => {
    setExpandedBuildIds(prev => 
      prev.includes(buildId) 
        ? prev.filter(id => id !== buildId) 
        : [...prev, buildId]
    );
  };

  const isBuildExpanded = (buildId: string) => {
    return expandedBuildIds.includes(buildId);
  };

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
    logs,
    setLogs,
    isComplete,
    setIsComplete,
    
    // Loading states
    isLoadingSpec,
    setIsLoadingSpec,
    isLoadingCode,
    setIsLoadingCode,
    isLoadingPreview,
    setIsLoadingPreview,
    
    // Auto-build toggle
    autoBuild,
    setAutoBuild,
    
    // Current build state
    selectedBuild,
    setSelectedBuild,
    
    // UI state
    promptInputValue,
    setPromptInputValue,
    buildError,
    setBuildError,

    // Build expansion state
    expandedBuildIds,
    toggleBuildExpansion,
    isBuildExpanded
  };
}
