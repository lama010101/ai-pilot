
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface BuildProgressProps {
  isProcessing: boolean;
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const BuildProgress: React.FC<BuildProgressProps> = ({ 
  isProcessing, 
  currentStep, 
  totalSteps, 
  steps 
}) => {
  if (!isProcessing) return null;
  
  const progressPercentage = Math.floor((currentStep / (totalSteps - 1)) * 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{steps[currentStep]}</span>
        <span>{progressPercentage}%</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="grid grid-cols-6 gap-2 mt-4">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`text-xs p-2 rounded-md text-center ${
              index < currentStep 
                ? 'bg-primary/20 text-primary-foreground' 
                : index === currentStep 
                  ? 'bg-primary text-primary-foreground animate-pulse-light' 
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {step.split('...')[0]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildProgress;
