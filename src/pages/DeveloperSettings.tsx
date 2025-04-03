
import { Helmet } from "react-helmet";
import DeveloperSettingsComponent from "@/components/DeveloperSettings";

const DeveloperSettingsPage = () => {
  return (
    <>
      <Helmet>
        <title>Developer Settings | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Developer Settings</h1>
        <p className="text-muted-foreground">
          Advanced settings for testing and development of the AI Pilot system
        </p>
        
        <DeveloperSettingsComponent />
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <h3 className="text-amber-800 font-medium">Developer Preview</h3>
          <p className="text-amber-700 text-sm mt-1">
            These settings are for development and testing purposes. Some features may be experimental
            and subject to change. Enable with caution.
          </p>
        </div>
      </div>
    </>
  );
};

export default DeveloperSettingsPage;
