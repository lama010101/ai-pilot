
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Use localStorage for persistence
const DEV_SETTINGS_KEY = "ai_pilot_dev_settings";

interface DevSettings {
  enableManualAgentTriggers: boolean;
}

const defaultSettings: DevSettings = {
  enableManualAgentTriggers: false
};

// Helper to get settings from localStorage
const getStoredSettings = (): DevSettings => {
  try {
    const stored = localStorage.getItem(DEV_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  } catch (e) {
    console.error("Failed to parse dev settings", e);
    return defaultSettings;
  }
};

// Helper to save settings to localStorage
const saveSettings = (settings: DevSettings) => {
  localStorage.setItem(DEV_SETTINGS_KEY, JSON.stringify(settings));
};

const DeveloperSettings = () => {
  const [settings, setSettings] = useState<DevSettings>(defaultSettings);

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  const handleToggleManualTriggers = (checked: boolean) => {
    const newSettings = {
      ...settings,
      enableManualAgentTriggers: checked
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    toast.success(
      checked 
        ? "Manual agent triggers enabled" 
        : "Manual agent triggers disabled"
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer Preview Settings</CardTitle>
        <CardDescription>
          Advanced settings for testing and development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="manual-triggers" className="flex flex-col space-y-1">
            <span>Enable Manual Agent Triggers</span>
            <span className="font-normal text-sm text-muted-foreground">
              Allow manually running agents and agent chains from the UI
            </span>
          </Label>
          <Switch
            id="manual-triggers"
            checked={settings.enableManualAgentTriggers}
            onCheckedChange={handleToggleManualTriggers}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Export a hook to check if manual triggers are enabled
export const useManualTriggersEnabled = (): boolean => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const settings = getStoredSettings();
    setEnabled(settings.enableManualAgentTriggers);
    
    // Listen for changes to settings
    const handleStorageChange = () => {
      const updatedSettings = getStoredSettings();
      setEnabled(updatedSettings.enableManualAgentTriggers);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return enabled;
};

export default DeveloperSettings;
