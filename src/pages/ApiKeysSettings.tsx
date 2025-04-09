
import React from 'react';
import { Helmet } from 'react-helmet';
import ApiKeysManager from '@/components/settings/ApiKeysManager';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const ApiKeysSettings = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isLeader = isAuthenticated && user?.email === import.meta.env.VITE_LEADER_EMAIL;
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
    }
    // If authenticated but not leader, redirect to dashboard
    else if (!isLeader) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLeader, navigate]);

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not leader but authenticated, show access denied
  if (!isLeader) {
    return (
      <>
        <Helmet>
          <title>Access Denied | AI Pilot</title>
        </Helmet>
        
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unauthorized Access</AlertTitle>
            <AlertDescription>
              Only the system Leader can access the API Keys Management.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

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
