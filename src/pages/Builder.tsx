
import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ChevronDown, ChevronUp, Clipboard } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Import our custom hooks
import { useAppBuilder } from '@/hooks/useAppBuilder';
import { useBuildHistory } from '@/hooks/useBuildHistory';
import { useUrlParams } from '@/hooks/useUrlParams';

// Import our components
import PromptInput from '@/components/builder/PromptInput';
import BuildProgress from '@/components/builder/BuildProgress';
import BuildPreview from '@/components/builder/BuildPreview';
import BuildHistoryList from '@/components/builder/BuildHistoryList';

const Builder = () => {
  // Use our custom hooks
  const {
    isProcessing,
    currentStep,
    steps,
    spec,
    code,
    logs,
    isComplete,
    selectedBuild,
    promptInputValue,
    buildError,
    isLoadingSpec,
    isLoadingCode,
    isLoadingPreview,
    handleSubmit,
    handleViewBuild,
    handleRemixBuild,
    loadBuildData,
    setPromptInputValue,
    continueToBuild,
    autoBuild,
    setAutoBuild,
    expandedBuildIds,
    toggleBuildExpansion,
    isPromptInputCollapsed,
    setIsPromptInputCollapsed,
    showFullLogs,
    setShowFullLogs,
    copyLogs
  } = useAppBuilder();
  
  const {
    appBuilds,
    isShowingHistory,
    isLoadingHistory,
    fetchBuildHistory,
    addBuildToHistory,
    toggleHistory
  } = useBuildHistory();
  
  // Ref for auto-scrolling to results
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Log on mount for debugging
  useEffect(() => {
    console.log("Builder page mounted");
  }, []);
  
  // Scroll to results when processing completes
  useEffect(() => {
    if (!isProcessing && isComplete && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isProcessing, isComplete]);
  
  // Handle URL parameters and shared builds
  useUrlParams((build) => {
    if (build) {
      console.log("Build loaded from URL params:", build.id);
      handleViewBuild(build);
      
      // Also update the history if needed
      if (build.id) {
        addBuildToHistory(build);
        fetchBuildHistory();
      }
    }
  });
  
  return (
    <>
      <Helmet>
        <title>App Builder | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI App Builder</h1>
            <p className="text-muted-foreground">
              Generate complete applications from natural language prompts
            </p>
          </div>
          
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={toggleHistory}
          >
            <History className="h-4 w-4" />
            {isShowingHistory ? 'Hide History' : 'Show History'}
          </Button>
        </div>
        
        {isShowingHistory && (
          <Card>
            <CardHeader>
              <CardTitle>Build History</CardTitle>
              <CardDescription>
                Your previous app builds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BuildHistoryList 
                builds={appBuilds} 
                onViewBuild={handleViewBuild}
                onRemixBuild={handleRemixBuild}
                isLoading={isLoadingHistory}
                currentBuildId={selectedBuild?.id}
                expandedBuildIds={expandedBuildIds}
                onToggleBuildExpansion={toggleBuildExpansion}
              />
            </CardContent>
          </Card>
        )}
        
        <Collapsible 
          open={!isPromptInputCollapsed} 
          onOpenChange={setIsPromptInputCollapsed}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create New App</CardTitle>
                  <CardDescription>
                    Describe the app you want to create in natural language
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isPromptInputCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <PromptInput 
                  isProcessing={isProcessing}
                  currentStep={currentStep}
                  steps={steps}
                  onSubmit={handleSubmit}
                  initialValue={promptInputValue}
                  buildError={buildError}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {isProcessing && (
          <Card className="p-4">
            <BuildProgress 
              isProcessing={isProcessing}
              currentStep={currentStep}
              totalSteps={steps.length}
              steps={steps}
            />
          </Card>
        )}
        
        <div ref={resultsRef}>
          <BuildPreview 
            spec={spec}
            code={code}
            logs={logs}
            isComplete={isComplete}
            isLoadingSpec={isLoadingSpec}
            isLoadingCode={isLoadingCode}
            isLoadingPreview={isLoadingPreview}
            selectedBuild={selectedBuild}
            onContinueToBuild={spec && !autoBuild ? continueToBuild : undefined}
            autoBuild={autoBuild}
            onAutoBuildChange={setAutoBuild}
            showFullLogs={showFullLogs}
            onToggleFullLogs={() => setShowFullLogs(!showFullLogs)}
            onCopyLogs={copyLogs}
          />
        </div>
      </div>
    </>
  );
};

export default Builder;
