
import React from 'react';
import { Helmet } from 'react-helmet';
import ApiKeysManager from '@/components/settings/ApiKeysManager';

const ApiKeysSettings = () => {
  return (
    <>
      <Helmet>
        <title>API Keys | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manage API Keys</h1>
        <p className="text-muted-foreground">
          Securely configure API keys for external services used by the AI Pilot system
        </p>
        
        <ApiKeysManager />
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <h3 className="text-amber-800 font-medium">Security Notice</h3>
          <p className="text-amber-700 text-sm mt-1">
            API keys are stored securely and never exposed to client-side code. Only the authenticated Leader 
            has access to view and manage these keys.
          </p>
        </div>
      </div>
    </>
  );
};

export default ApiKeysSettings;
