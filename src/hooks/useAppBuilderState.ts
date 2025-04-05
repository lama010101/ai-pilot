
import { useState, useEffect } from 'react';
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
  const [isPromptInputCollapsed, setIsPromptInputCollapsed] = useState<boolean>(false);
  
  // Add a 'show full logs' state
  const [showFullLogs, setShowFullLogs] = useState<boolean>(false);

  // When processing starts, collapse the prompt input
  useEffect(() => {
    if (isProcessing) {
      setIsPromptInputCollapsed(true);
    }
  }, [isProcessing]);

  // When a new build is selected, expand it and collapse others
  useEffect(() => {
    if (selectedBuild?.id) {
      if (!expandedBuildIds.includes(selectedBuild.id)) {
        setExpandedBuildIds(prev => [...prev, selectedBuild.id as string]);
      }
    }
  }, [selectedBuild, expandedBuildIds]);

  const toggleBuildExpansion = (buildId: string) => {
    setExpandedBuildIds(prev => 
      prev.includes(buildId) 
        ? prev.filter(id => id !== buildId) 
        : [...prev, buildId]
    );
  };

  // Function to add a log entry instead of using toast
  const appendLog = (type: 'info' | 'success' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? 'ERROR' : type === 'success' ? 'SUCCESS' : 'INFO';
    setLogs(prev => [...prev, `[${timestamp}] ${prefix}: ${message}`]);
    
    // Also log to console for debugging
    console.log(`[${timestamp}] ${prefix}: ${message}`);
  };
  
  // Function to copy all logs to clipboard
  const copyLogs = () => {
    const logText = logs.join('\n');
    navigator.clipboard.writeText(logText)
      .then(() => {
        appendLog('success', 'Logs copied to clipboard');
      })
      .catch(err => {
        appendLog('error', `Failed to copy logs: ${err.message}`);
      });
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
    appendLog,
    copyLogs,
    showFullLogs,
    setShowFullLogs,
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
    isPromptInputCollapsed,
    setIsPromptInputCollapsed,

    // Build expansion state
    expandedBuildIds,
    toggleBuildExpansion
  };
}
