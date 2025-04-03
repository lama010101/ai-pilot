
import { useState, useEffect } from "react";

// Keys for localStorage
const DEVELOPER_SETTINGS_KEY = "ai_pilot_dev_settings";

// Developer settings interface
export interface DeveloperSettings {
  enableManualAgentTriggers: boolean;
}

// Default settings
export const defaultSettings: DeveloperSettings = {
  enableManualAgentTriggers: false
};

// Get settings from localStorage
export const getDeveloperSettings = (): DeveloperSettings => {
  try {
    const stored = localStorage.getItem(DEVELOPER_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  } catch (e) {
    console.error("Error parsing developer settings:", e);
    return defaultSettings;
  }
};

// Save settings to localStorage
export const saveDeveloperSettings = (settings: DeveloperSettings): void => {
  localStorage.setItem(DEVELOPER_SETTINGS_KEY, JSON.stringify(settings));
  
  // Dispatch a custom event so other components can react to the change
  window.dispatchEvent(new CustomEvent("developer-settings-changed", { detail: settings }));
};

// Hook to access and manage developer settings
export const useDeveloperSettings = () => {
  const [settings, setSettings] = useState<DeveloperSettings>(getDeveloperSettings());
  
  useEffect(() => {
    // Update settings when storage changes
    const handleStorageChange = () => {
      setSettings(getDeveloperSettings());
    };
    
    // Update settings when custom event is fired
    const handleSettingsChanged = (event: CustomEvent<DeveloperSettings>) => {
      setSettings(event.detail);
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("developer-settings-changed", handleSettingsChanged as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("developer-settings-changed", handleSettingsChanged as EventListener);
    };
  }, []);
  
  // Function to update a specific setting
  const updateSetting = <K extends keyof DeveloperSettings>(
    key: K, 
    value: DeveloperSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveDeveloperSettings(newSettings);
  };
  
  return {
    settings,
    updateSetting,
    areManualTriggersEnabled: settings.enableManualAgentTriggers
  };
};
