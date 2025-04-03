
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleDollarSign, Save, AlertTriangle } from "lucide-react";
import { getBudgetSettings, updateBudgetSettings } from "@/lib/supabaseService";
import { toast } from "sonner";
import { BudgetSettingsDB } from "@/lib/supabaseTypes";
import { Separator } from "@/components/ui/separator";

const BudgetSettings = () => {
  const [settings, setSettings] = useState<BudgetSettingsDB>({
    monthly_limit: 100,
    kill_threshold: 2
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await getBudgetSettings();
        if (error) throw error;
        
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching budget settings:", error);
        toast.error("Failed to load budget settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { error } = await updateBudgetSettings(settings);
      if (error) throw error;
      
      toast.success("Budget settings updated successfully");
    } catch (error) {
      console.error("Error saving budget settings:", error);
      toast.error("Failed to save budget settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (field: keyof BudgetSettingsDB, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSettings({
        ...settings,
        [field]: numValue
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CircleDollarSign className="h-8 w-8 text-primary" />
          Budget Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure system-wide budget limits and thresholds
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>
            Set the maximum allowed spending per month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-limit">Monthly Limit ($)</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md">
                $
              </span>
              <Input
                id="monthly-limit"
                type="number"
                min="0"
                step="10"
                value={settings.monthly_limit}
                onChange={(e) => handleInputChange('monthly_limit', e.target.value)}
                className="rounded-l-none"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              System will block new tasks when this limit is reached
            </p>
          </div>
          
          <div className="flex items-center p-3 text-sm rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            <p>
              This limit applies across all agents. Once reached, only Leader can override.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Safety Thresholds</CardTitle>
          <CardDescription>
            Configure when the system should intervene
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kill-threshold">Auto-Kill Threshold</Label>
            <div className="flex items-center">
              <Input
                id="kill-threshold"
                type="number"
                min="1"
                step="0.5"
                value={settings.kill_threshold}
                onChange={(e) => handleInputChange('kill_threshold', e.target.value)}
                className="max-w-[100px]"
              />
              <span className="ml-2">× task cost</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Finance AI will terminate tasks that exceed this multiple of their estimated cost
            </p>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <p className="mb-2 font-medium">Warning Thresholds</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-green-50 text-green-800 border border-green-200">
                Below 80%: Normal operation
              </div>
              <div className="p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                80-100%: Warning displayed
              </div>
              <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
                100%+: Tasks blocked
              </div>
              <div className="p-3 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                Phase 1 limit: $100
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default BudgetSettings;
