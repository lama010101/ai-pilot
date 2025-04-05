
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check if the URL contains dashboard-dev to determine where to redirect
  const isDev = location.pathname.includes('dashboard-dev');

  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated) {
      // If user is authenticated, redirect to the appropriate dashboard
      navigate(isDev ? '/dashboard-dev' : '/dashboard/chat');
    } else {
      // If user is not authenticated, redirect to login
      navigate('/login', { state: { from: { pathname: isDev ? '/dashboard-dev' : '/dashboard' } } });
    }
  }, [navigate, isAuthenticated, isLoading, isDev]);

  // Improved loading state with more feedback
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
