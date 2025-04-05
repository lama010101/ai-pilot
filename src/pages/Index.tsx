
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState({
    authChecked: false,
    startTime: new Date().toISOString(),
    redirectTarget: '',
    redirectAttempted: false
  });
  
  // Check if the URL contains dashboard-dev to determine where to redirect
  const isDev = location.pathname.includes('dashboard-dev');

  useEffect(() => {
    console.log("Index page mounted, auth status:", { isAuthenticated, isLoading });
    
    if (isLoading) return;
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      authChecked: true,
      redirectTarget: isAuthenticated 
        ? (isDev ? '/dashboard-dev/pilot' : '/dashboard/pilot') 
        : '/login'
    }));
    
    if (!debugInfo.redirectAttempted) {
      setDebugInfo(prev => ({ ...prev, redirectAttempted: true }));
      
      if (isAuthenticated) {
        // If user is authenticated, redirect to the appropriate dashboard
        console.log("User is authenticated, redirecting to:", isDev ? '/dashboard-dev/pilot' : '/dashboard/pilot');
        navigate(isDev ? '/dashboard-dev/pilot' : '/dashboard/pilot', { replace: true });
      } else {
        // If user is not authenticated, redirect to login
        console.log("User is not authenticated, redirecting to login");
        navigate('/login', { 
          state: { from: { pathname: isDev ? '/dashboard-dev/pilot' : '/dashboard/pilot' } },
          replace: true
        });
      }
    }
  }, [navigate, isAuthenticated, isLoading, isDev, debugInfo.redirectAttempted]);

  // Add emergency fallback if index gets stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!debugInfo.redirectAttempted) {
        console.log("Emergency redirect to login");
        navigate('/login', { replace: true });
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [navigate, debugInfo.redirectAttempted]);

  // Improved loading state with more feedback and debug info
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
        <p className="mt-4 text-pilot-200">Redirecting to dashboard...</p>
        <p className="mt-2 text-xs text-pilot-100">
          {isLoading ? "Checking authentication..." : 
           isAuthenticated ? `Loading ${isDev ? "development" : ""} dashboard...` : "Redirecting to login..."}
        </p>
      </div>
    </div>
  );
};

export default Index;
