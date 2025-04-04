
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import AuthGuard from './AuthGuard';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const DashboardLayout = () => {
  useEffect(() => {
    console.log("Dashboard layout mounted");
    
    // Log any stored build data that might be causing issues
    try {
      const storedData = localStorage.getItem('app_builder_state');
      if (storedData) {
        console.log("Found stored app builder state");
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
    }
  }, []);

  return (
    <AuthGuard>
      <ErrorBoundary>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </AuthGuard>
  );
};

export default DashboardLayout;
