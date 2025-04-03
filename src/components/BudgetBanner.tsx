
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CircleDollarSign, AlertTriangle, AlertCircle } from "lucide-react";
import { getBudgetSettings, getMonthlySpending } from "@/lib/supabaseService";
import { Progress } from "@/components/ui/progress";

const BudgetBanner = () => {
  const [monthlySpend, setMonthlySpend] = useState<number>(0);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchData = async () => {
    try {
      // Get budget settings
      const { data: budgetSettings } = await getBudgetSettings();
      if (budgetSettings) {
        setMonthlyLimit(budgetSettings.monthly_limit);
      }
      
      // Get monthly spending
      const { data: spending } = await getMonthlySpending();
      if (typeof spending === 'number') {
        setMonthlySpend(spending);
      }
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Update every minute
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Calculate percentage of budget used
  const percentUsed = (monthlySpend / monthlyLimit) * 100;
  
  // Determine warning level based on spend
  const getWarningLevel = () => {
    if (percentUsed >= 100) {
      return {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        message: "Budget Exceeded",
        progressColor: "bg-red-500"
      };
    } else if (percentUsed >= 80) {
      return {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        message: "Near Budget Limit",
        progressColor: "bg-amber-500"
      };
    } else {
      return {
        color: "bg-blue-50 text-blue-700 border-blue-100",
        icon: <CircleDollarSign className="h-5 w-5 text-blue-600" />,
        message: "Budget Status",
        progressColor: "bg-blue-500"
      };
    }
  };
  
  const warningLevel = getWarningLevel();
  
  if (isLoading) {
    return (
      <Card className="w-full bg-muted/30 h-12 animate-pulse">
        <CardContent className="p-3" />
      </Card>
    );
  }
  
  return (
    <Card className={`w-full border ${warningLevel.color}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {warningLevel.icon}
            <span className="font-medium">{warningLevel.message}</span>
          </div>
          <div className="text-sm font-semibold">
            ${monthlySpend.toFixed(2)} of ${monthlyLimit.toFixed(2)}
          </div>
        </div>
        
        <Progress 
          value={Math.min(percentUsed, 100)} 
          className="h-2" 
          indicatorClassName={warningLevel.progressColor}
        />
        
        {percentUsed >= 100 && (
          <p className="text-xs text-red-600 mt-1">
            New tasks are disabled until budget is increased or reset
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetBanner;
