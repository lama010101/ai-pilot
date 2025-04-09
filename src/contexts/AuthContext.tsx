
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, USE_FAKE_AUTH } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Get the leader email from environment variables
const LEADER_EMAIL = import.meta.env.VITE_LEADER_EMAIL || 'emartin6867@gmail.com';

// Maximum number of retries for auth operations
const MAX_AUTH_RETRIES = 3;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>; 
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!USE_FAKE_AUTH);
  const [isAuthenticated, setIsAuthenticated] = useState(USE_FAKE_AUTH);
  const navigate = useNavigate();

  // Function to retry auth operations with exponential backoff
  const retryOperation = async (operation: () => Promise<any>, retries = MAX_AUTH_RETRIES, delay = 1000) => {
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) {
        console.error('Operation failed after maximum retries:', error);
        toast.error('Authentication failed after multiple attempts');
        throw error;
      }
      
      console.log(`Retrying operation, ${retries} attempts left. Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
  };

  useEffect(() => {
    console.log("AuthProvider mounted, USE_FAKE_AUTH:", USE_FAKE_AUTH);
    
    // Skip Supabase session check if using fake auth
    if (USE_FAKE_AUTH) {
      return;
    }

    // Check if there's an active session
    const checkSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session }, error } = await retryOperation(() => 
          supabase.auth.getSession()
        );
        
        if (error) {
          console.error('Error getting session:', error);
          toast.error('Failed to check authentication status');
          setIsLoading(false);
          return;
        }
        
        console.log("Session check complete:", session ? "Session found" : "No session");
        
        // If we have a session, check if the user is authorized
        if (session) {
          const userEmail = session.user?.email;
          console.log("Found user with email:", userEmail);
          
          if (userEmail !== LEADER_EMAIL) {
            console.log('Unauthorized access attempt:', userEmail);
            await supabase.auth.signOut();
            navigate('/unauthorized');
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
            toast.error('Unauthorized access attempt');
          } else {
            setSession(session);
            setUser(session.user);
            setIsAuthenticated(true);
            toast.success(`Welcome back, ${session.user.email}`);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        toast.error('Authentication check failed');
        setIsLoading(false);
      }
    };

    // Set up auth change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "No session");
      
      // If session exists, check if user is authorized
      if (session) {
        const userEmail = session.user?.email;
        
        if (userEmail !== LEADER_EMAIL) {
          console.log('Unauthorized access attempt:', userEmail);
          supabase.auth.signOut().then(() => {
            navigate('/unauthorized');
          });
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          toast.error('Unauthorized access attempt');
        } else {
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Only show welcome toast on sign_in event, not on every state change
          if (_event === 'SIGNED_IN') {
            toast.success(`Welcome, ${session.user.email}`);
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        
        // Only show sign out toast on sign_out event
        if (_event === 'SIGNED_OUT') {
          toast.info('You have been signed out');
        }
      }
      
      setIsLoading(false);
    });

    // Then check for existing session
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    console.log("signInWithGoogle called, USE_FAKE_AUTH:", USE_FAKE_AUTH);
    
    if (USE_FAKE_AUTH) {
      // Fake authentication - just redirect to dashboard
      console.log("Using fake auth, setting isAuthenticated to true");
      setIsAuthenticated(true);
      console.log("Redirecting to dashboard (fake auth)");
      navigate('/dashboard/builder');
      toast.success('Signed in with fake auth');
      return;
    }

    try {
      console.log("Starting Google OAuth flow");
      const { error } = await retryOperation(() => 
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard/builder`,
          },
        })
      );
      
      if (error) {
        console.error('Error during Google sign in:', error);
        toast.error(`Google sign-in failed: ${error.message}`);
        throw error;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log("signInWithEmail called, USE_FAKE_AUTH:", USE_FAKE_AUTH);
    
    if (USE_FAKE_AUTH) {
      // Fake authentication - just redirect to dashboard
      console.log("Using fake auth, setting isAuthenticated to true");
      setIsAuthenticated(true);
      console.log("Redirecting to dashboard (fake auth)");
      navigate('/dashboard/builder');
      toast.success('Signed in with fake auth');
      return;
    }

    try {
      console.log(`Signing in with email: ${email}`);
      
      if (email !== LEADER_EMAIL) {
        console.log('Unauthorized email attempt:', email);
        toast.error('Unauthorized email address');
        navigate('/unauthorized');
        return;
      }
      
      // In production, this would check the actual password
      // For now, we just allow the Leader email to sign in
      const { data, error } = await retryOperation(() => 
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );
      
      if (error) {
        console.error('Error signing in with email:', error);
        toast.error(`Email login failed: ${error.message}`);
        
        // If the user doesn't exist, try to create the account
        if (error.message.includes('Invalid login credentials')) {
          console.log('User not found, attempting to create account');
          toast.info('Account not found, creating new account');
          
          const { error: signUpError } = await retryOperation(() => 
            supabase.auth.signUp({
              email,
              password,
            })
          );
          
          if (signUpError) {
            console.error('Error creating account:', signUpError);
            toast.error(`Failed to create account: ${signUpError.message}`);
            return;
          }
          
          // Account created, navigate to dashboard
          console.log('Account created, setting isAuthenticated to true');
          toast.success('Account created successfully');
          setIsAuthenticated(true);
          navigate('/dashboard/builder');
        }
        return;
      }
      
      console.log('Email sign in successful');
      setSession(data.session);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Signed in successfully');
      navigate('/dashboard/builder');
    } catch (error) {
      console.error('Error signing in with email:', error);
      toast.error('Failed to sign in with email');
    }
  };

  const signOut = async () => {
    console.log("signOut called, USE_FAKE_AUTH:", USE_FAKE_AUTH);
    
    if (USE_FAKE_AUTH) {
      // Fake sign out - just redirect to login
      console.log("Using fake auth, setting isAuthenticated to false");
      setIsAuthenticated(false);
      console.log("Redirecting to login (fake auth)");
      navigate('/login');
      toast.info('Signed out (fake auth)');
      return;
    }

    try {
      console.log("Signing out via Supabase");
      await retryOperation(() => supabase.auth.signOut());
      console.log("Sign out complete, redirecting to login");
      toast.info('You have been signed out');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
