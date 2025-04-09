
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    console.log("Index page mounted, auth status:", { isAuthenticated, isLoading });
    
    if (isLoading) return;
    
    if (isAuthenticated) {
      // If user is authenticated, redirect to the dashboard
      console.log("User is authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    } else {
      // If user is not authenticated, redirect to login
      console.log("User is not authenticated, redirecting to login");
      navigate('/login', { 
        state: { from: { pathname: '/dashboard' } },
        replace: true
      });
    }
  }, [navigate, isAuthenticated, isLoading]);

  // Loading state while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
        <p className="mt-4 text-pilot-200">Redirecting to dashboard...</p>
        <p className="mt-2 text-xs text-pilot-100">
          {isLoading ? "Checking authentication..." : 
           isAuthenticated ? "Loading dashboard..." : "Redirecting to login..."}
        </p>
      </div>
    </div>
  );
};

export default Index;
