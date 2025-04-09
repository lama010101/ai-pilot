
import React from 'react';
import { Helmet } from 'react-helmet';
import DashboardLayout from '@/components/DashboardLayout';
import ApiKeySettingsPanel from '@/components/settings/ApiKeySettingsPanel';
import { LEADER_EMAIL } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LockIcon } from 'lucide-react';

const ApiSettings = () => {
  const { user } = useAuth();
  const isAuthorized = user?.email === LEADER_EMAIL;

  return (
    <>
      <Helmet>
        <title>API Settings - AI Pilot</title>
      </Helmet>

      <DashboardLayout>
        <div className="container mx-auto p-6">
          {isAuthorized ? (
            <ApiKeySettingsPanel />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <LockIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Only the system leader ({LEADER_EMAIL}) can access API settings and credentials.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default ApiSettings;
