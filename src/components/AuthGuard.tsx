
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasVerifiedAuth, setHasVerifiedAuth] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    console.log("AuthGuard mounted, auth status:", { isAuthenticated, isLoading });
    
    // Only redirect if authentication check is complete and we haven't already tried redirecting
    if (!isLoading && !redirectAttempted) {
      setRedirectAttempted(true);
      
      if (!isAuthenticated) {
        console.log("AuthGuard: User not authenticated, redirecting to login");
        toast.error("Authentication required. Please log in.");
        // Save the location they were trying to go to
        navigate('/login', { state: { from: location } });
      } else {
        console.log("AuthGuard: User is authenticated, allowing access");
        setHasVerifiedAuth(true);
        toast.success("Authentication verified");
      }
    }
  }, [isAuthenticated, isLoading, navigate, location, redirectAttempted]);

  // Add additional verification check for cases where auth state changes unexpectedly
  useEffect(() => {
    // Check auth again after 2 seconds
    const interval = setInterval(() => {
      if (!isLoading && isAuthenticated && !hasVerifiedAuth && checkCount < 3) {
        console.log("AuthGuard: Running additional verification check", checkCount);
        setCheckCount(prev => prev + 1);
        setHasVerifiedAuth(true);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isLoading, isAuthenticated, hasVerifiedAuth, checkCount]);

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
          <p className="mt-4 text-pilot-200">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If we've verified auth and user is authenticated, render children
  if (hasVerifiedAuth && isAuthenticated) {
    return (
      <>
        <div id="dashboard-loaded" className="sr-only">Loaded dashboard layout</div>
        {children}
      </>
    );
  }

  // Show a fallback while waiting for redirect to complete
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
        <p className="mt-4 text-pilot-200">Redirecting to login...</p>
      </div>
    </div>
  );
};

export default AuthGuard;
