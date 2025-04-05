import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import UniversalChat from './UniversalChat';
import AuthGuard from './AuthGuard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw, ArrowRightLeft } from 'lucide-react';

// Simple error boundary component
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      setHasError(true);
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  const handleReset = () => {
    setHasError(false);
    navigate('/dashboard/chat');
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-background">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Dashboard Error</AlertTitle>
            <AlertDescription>
              An unexpected error occurred while loading the dashboard content.
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={handleReset} className="w-full">
              <Home className="mr-2 h-4 w-4" /> Go to Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Component to handle corrupted storage data
const StorageDataChecker = ({ children }: { children: React.ReactNode }) => {
  const [hasCorruptedData, setHasCorruptedData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStorageData = () => {
      try {
        const keysToCheck = [
          'app_builder_state', 
          'app_builds', 
          'builder_session', 
          'builder_state'
        ];
        
        let foundCorruption = false;
        
        keysToCheck.forEach(key => {
          try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
              try {
                JSON.parse(storedData);
                console.log(`Valid ${key} data found`);
              } catch (parseError) {
                console.error(`Found corrupted ${key} data, removing it:`, parseError);
                localStorage.removeItem(key);
                foundCorruption = true;
              }
            }
          } catch (error) {
            console.error(`Error accessing localStorage for ${key}:`, error);
          }
        });
        
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('build_')) {
            try {
              const storedData = localStorage.getItem(key);
              if (storedData) {
                try {
                  JSON.parse(storedData);
                } catch (parseError) {
                  console.error(`Found corrupted build data in ${key}, removing it:`, parseError);
                  localStorage.removeItem(key);
                  foundCorruption = true;
                }
              }
            } catch (error) {
              console.error(`Error accessing localStorage for ${key}:`, error);
            }
          }
        });
        
        setHasCorruptedData(foundCorruption);
      } catch (error) {
        console.error("Error checking localStorage:", error);
      }
    };
    
    checkStorageData();
  }, []);

  const handleReset = () => {
    const keysToRemove = [
      'app_builder_state', 
      'app_builds', 
      'builder_session', 
      'builder_state'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error);
      }
    });
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('build_')) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`Error removing ${key} from localStorage:`, error);
        }
      }
    });
    
    setHasCorruptedData(false);
    navigate('/dashboard/chat', { replace: true });
  };

  if (hasCorruptedData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-background">
        <div className="w-full max-w-md">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Corrupted Data Detected</AlertTitle>
            <AlertDescription>
              We found corrupted app data in your browser storage. This has been cleaned up to prevent errors.
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={handleReset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" /> Reset and Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Debug Panel component to show session and routing state
const DebugPanel = () => {
  const { user, session, isAuthenticated } = useAuth();
  const location = useLocation();
  const isDev = location.pathname.includes('dashboard-dev');
  const [lastBuildId, setLastBuildId] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const storedBuilds = localStorage.getItem('app_builds');
      if (storedBuilds) {
        const builds = JSON.parse(storedBuilds);
        if (builds.length > 0) {
          setLastBuildId(builds[0].id);
        }
      }
    } catch (error) {
      console.error("Error getting last build ID:", error);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 text-xs bg-background border border-border rounded-lg p-3 shadow-md w-64 z-50">
      <h4 className="font-medium mb-2 flex items-center justify-between">
        Debug Info
        <span className="text-green-500">✓ Mounted</span>
      </h4>
      <div className="space-y-1 text-muted-foreground">
        <p>Auth: {isAuthenticated ? '✅ Signed in' : '❌ Not signed in'}</p>
        <p>User: {user?.email || 'None'}</p>
        <p>Path: {location.pathname}</p>
        <p>Dashboard: {isDev ? 'DEV' : 'PROD'}</p>
        <p>Session: {session ? '✅ Active' : '❌ None'}</p>
        <p>Last build: {lastBuildId || 'None'}</p>
      </div>
    </div>
  );
};

// Dashboard switcher button
const DashboardSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDev = location.pathname.includes('dashboard-dev');
  
  const switchDashboard = () => {
    const currentPath = isDev 
      ? location.pathname.replace('/dashboard-dev', '') 
      : location.pathname.replace('/dashboard', '');
    
    const targetPath = isDev 
      ? `/dashboard${currentPath}` 
      : `/dashboard-dev${currentPath}`;
    
    console.log(`Switching from ${location.pathname} to ${targetPath}`);
    navigate(targetPath);
  };
  
  return (
    <Button 
      onClick={switchDashboard} 
      variant="outline" 
      size="sm"
      className="flex items-center gap-1"
    >
      <ArrowRightLeft size={14} />
      Switch to {isDev ? 'Production' : 'Development'} Dashboard
    </Button>
  );
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [hasRendered, setHasRendered] = useState(false);
  
  useEffect(() => {
    console.log("DashboardLayout mounted at path:", location.pathname);
    setHasRendered(true);
    
    // Add emergency redirect if page remains blank
    const timeout = setTimeout(() => {
      if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
        console.log("Emergency redirect to /dashboard/pilot");
        navigate('/dashboard/pilot', { replace: true });
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [location.pathname, navigate]);

  // Show loading indicator while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
          <p className="mt-4 text-pilot-200">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <ErrorBoundary>
        <StorageDataChecker>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header extraButtons={<DashboardSwitcher />} />
              <main className="flex-1 overflow-auto p-6">
                <Outlet />
              </main>
              <UniversalChat />
            </div>
          </div>
        </StorageDataChecker>
      </ErrorBoundary>
    </AuthGuard>
  );
};

export default DashboardLayout;
