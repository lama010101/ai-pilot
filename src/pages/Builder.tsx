
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import our custom hooks
import { useAppBuilder } from '@/hooks/useAppBuilder';
import { useBuildHistory } from '@/hooks/useBuildHistory';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useAuth } from '@/contexts/AuthContext';

// Import our components
import PromptInput from '@/components/builder/PromptInput';
import BuildProgress from '@/components/builder/BuildProgress';
import BuildPreview from '@/components/builder/BuildPreview';
import BuildHistoryList from '@/components/builder/BuildHistoryList';

const Builder = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Use our custom hooks
  const {
    isProcessing,
    currentStep,
    steps,
    spec,
    code,
    isComplete,
    selectedBuild,
    promptInputValue,
    buildError,
    handleSubmit,
    handleViewBuild,
    handleRemixBuild,
    loadBuildData,
    setPromptInputValue
  } = useAppBuilder();
  
  const {
    appBuilds,
    isShowingHistory,
    isLoadingHistory,
    fetchBuildHistory,
    addBuildToHistory,
    toggleHistory
  } = useBuildHistory();
  
  // Handle URL parameters and shared builds
  useUrlParams((build) => {
    handleViewBuild(build);
    
    // Also update the history if needed
    if (build && build.id) {
      addBuildToHistory(build);
      fetchBuildHistory();
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // This shouldn't render as we redirect in the useEffect, but as a fallback
    return null;
  }
  
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
              />
            </CardContent>
          </Card>
        )}
        
        <PromptInput 
          isProcessing={isProcessing}
          currentStep={currentStep}
          steps={steps}
          onSubmit={handleSubmit}
          initialValue={promptInputValue}
          buildError={buildError}
        />
        
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
        
        <BuildPreview 
          spec={spec}
          code={code}
          isComplete={isComplete}
          selectedBuild={selectedBuild}
        />
      </div>
    </>
  );
};

export default Builder;
