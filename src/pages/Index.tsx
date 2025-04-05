
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
    redirectTarget: ''
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
        ? (isDev ? '/dashboard-dev' : '/dashboard') 
        : '/login'
    }));
    
    if (isAuthenticated) {
      // If user is authenticated, redirect to the appropriate dashboard
      console.log("User is authenticated, redirecting to:", isDev ? '/dashboard-dev' : '/dashboard');
      navigate(isDev ? '/dashboard-dev' : '/dashboard', { replace: true });
    } else {
      // If user is not authenticated, redirect to login
      console.log("User is not authenticated, redirecting to login");
      navigate('/login', { 
        state: { from: { pathname: isDev ? '/dashboard-dev' : '/dashboard' } },
        replace: true
      });
    }
  }, [navigate, isAuthenticated, isLoading, isDev]);

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
        
        {/* Debug information - will remove after fixing visibility issues */}
        <div className="mt-6 p-4 border border-gray-200 rounded text-xs text-left w-64">
          <p>Started: {debugInfo.startTime}</p>
          <p>Auth checked: {debugInfo.authChecked ? '✅' : '⏳'}</p>
          <p>Target: {debugInfo.redirectTarget || 'Not set yet'}</p>
          <p>isLoading: {isLoading ? 'true' : 'false'}</p>
          <p>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
