
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasVerifiedAuth, setHasVerifiedAuth] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    console.log("AuthGuard mounted, auth status:", { isAuthenticated, isLoading });
    
    // Only redirect if authentication check is complete and we haven't already tried redirecting
    if (!isLoading && !redirectAttempted) {
      setRedirectAttempted(true);
      
      if (!isAuthenticated) {
        console.log("AuthGuard: User not authenticated, redirecting to login");
        // Save the location they were trying to go to
        navigate('/login', { state: { from: location } });
      } else {
        console.log("AuthGuard: User is authenticated, allowing access");
        setHasVerifiedAuth(true);
      }
    }
  }, [isAuthenticated, isLoading, navigate, location, redirectAttempted]);

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
