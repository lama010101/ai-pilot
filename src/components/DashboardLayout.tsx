
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import AuthGuard from './AuthGuard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

// Simple error boundary component
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Add global error handler
    const errorHandler = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      setHasError(true);
      // Prevent the default error handling
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
    // Check for corrupted localStorage items
    const checkStorageData = () => {
      try {
        // List of keys that could contain corrupted data
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
              // Try to parse JSON data to see if it's valid
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
        
        // Also check for any keys starting with "build_"
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
    // Clear potentially problematic localStorage items
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
    
    // Also remove any keys starting with "build_"
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

const DashboardLayout = () => {
  useEffect(() => {
    console.log("Dashboard layout mounted");
  }, []);

  return (
    <AuthGuard>
      <ErrorBoundary>
        <StorageDataChecker>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                <Outlet />
              </main>
            </div>
          </div>
        </StorageDataChecker>
      </ErrorBoundary>
    </AuthGuard>
  );
};

export default DashboardLayout;
