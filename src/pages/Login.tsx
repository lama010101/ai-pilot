
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { USE_FAKE_AUTH } from '@/lib/supabaseClient';
import { ArrowRight, Key } from 'lucide-react';

const Login = () => {
  const { signInWithGoogle, signInWithEmail, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [debugInfo, setDebugInfo] = useState({ 
    redirectAttempted: false,
    redirectTarget: '',
    authStatus: ''
  });
  
  // Check if the user was trying to access the dev dashboard
  const from = location.state?.from?.pathname || '';
  const redirectPath = from.includes('dashboard-dev') ? '/dashboard-dev/builder' : '/dashboard/builder';

  useEffect(() => {
    console.log("Login page mounted, auth status:", { isAuthenticated, isLoading, from, redirectPath });
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      authStatus: isAuthenticated 
        ? 'authenticated' 
        : isLoading 
          ? 'loading' 
          : 'not authenticated',
      redirectTarget: redirectPath
    }));
    
    if (isAuthenticated && !isLoading && !debugInfo.redirectAttempted) {
      console.log("Login: User is authenticated, redirecting to:", redirectPath);
      setDebugInfo(prev => ({ ...prev, redirectAttempted: true }));
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectPath, from, debugInfo.redirectAttempted]);

  // Add emergency fallback if login gets stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isAuthenticated && !debugInfo.redirectAttempted) {
        console.log("Emergency redirect to dashboard");
        navigate('/dashboard/builder', { replace: true });
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [navigate, isAuthenticated, debugInfo.redirectAttempted]);

  const handleSignIn = () => {
    console.log("Sign in button clicked");
    signInWithGoogle();
  };
  
  // Temp login handler - automatically logs in as emartin6867@gmail.com
  const handleTempLogin = () => {
    console.log("Temp login clicked");
    // If we're using fake auth, we can just pretend to log in
    if (USE_FAKE_AUTH) {
      signInWithEmail('emartin6867@gmail.com', 'dummy-password');
    } else {
      // In production, we'd use a more secure method
      console.log("Attempting temp login with emartin6867@gmail.com");
      signInWithEmail('emartin6867@gmail.com', 'dummy-password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-pilot-400">AI Pilot</h1>
          <p className="mt-2 text-muted-foreground">Leader Control Dashboard</p>
          
          {USE_FAKE_AUTH && (
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Dev Mode
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Access restricted to authorized personnel only
          </p>
          
          <Button 
            onClick={handleSignIn}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 0 1-6.021-6.022 6.033 6.033 0 0 1 6.021-6.022c1.508 0 2.873.577 3.908 1.522l2.798-2.799A10.004 10.004 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
              />
            </svg>
            {USE_FAKE_AUTH ? 'Sign in (Dev Mode)' : 'Sign in with Google'}
          </Button>
          
          <div className="mt-6 text-center">
            {/* Replace "Back to Welcome" with "Temp" button */}
            <Button 
              variant="outline" 
              onClick={handleTempLogin}
              className="text-muted-foreground flex items-center gap-1"
            >
              <Key size={16} className="mr-1" />
              Temp
            </Button>
          </div>
        </div>
        
        {/* Debug information */}
        <div className="mt-6 p-2 border border-gray-200 rounded text-xs">
          <div className="text-muted-foreground space-y-1">
            <p>Auth status: {debugInfo.authStatus}</p>
            <p>Redirect target: {debugInfo.redirectTarget}</p>
            <p>Redirect attempted: {debugInfo.redirectAttempted ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
      
      <div id="debug-overlay" style={{ position: 'fixed', bottom: 0, left: 0, background: '#111', color: '#0f0', padding: '8px', zIndex: 9999 }}>
        ROUTE: /login | Auth: {isAuthenticated ? '✅' : '❌'} | Loading: {isLoading ? '⏳' : '✓'}
      </div>
    </div>
  );
};

export default Login;
