
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'; // Use the standardized client
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Get the leader email from environment variables
const LEADER_EMAIL = import.meta.env.VITE_LEADER_EMAIL || 'emartin6867@gmail.com';
// Use the development flag for fake authentication
const USE_FAKE_AUTH = import.meta.env.VITE_USE_FAKE_AUTH === 'true';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!USE_FAKE_AUTH);
  const [isAuthenticated, setIsAuthenticated] = useState(USE_FAKE_AUTH);
  const navigate = useNavigate();

  useEffect(() => {
    // Skip Supabase session check if using fake auth
    if (USE_FAKE_AUTH) {
      // For dev mode, create a fake user and session
      const fakeUser = {
        id: 'fake-user-id',
        email: LEADER_EMAIL,
      } as User;
      
      const fakeSession = {
        user: fakeUser,
        access_token: 'fake-token',
      } as Session;
      
      setUser(fakeUser);
      setSession(fakeSession);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check if there's an active session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        // If we have a session, check if the user is authorized
        if (session) {
          const userEmail = session.user?.email;
          
          if (userEmail !== LEADER_EMAIL) {
            console.log('Unauthorized access attempt:', userEmail);
            await supabase.auth.signOut();
            navigate('/unauthorized');
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
          } else {
            console.log('Session found and authenticated:', session.user.id);
            setSession(session);
            setUser(session.user);
            setIsAuthenticated(true);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        } else {
          console.log('Auth state changed - authenticated:', session.user.id);
          setSession(session);
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } else {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    if (USE_FAKE_AUTH) {
      // Fake authentication - just redirect to dashboard
      // Create fake user and session for dev mode
      const fakeUser = {
        id: 'fake-user-id',
        email: LEADER_EMAIL,
      } as User;
      
      const fakeSession = {
        user: fakeUser,
        access_token: 'fake-token',
      } as Session;
      
      setUser(fakeUser);
      setSession(fakeSession);
      setIsAuthenticated(true);
      
      toast("Welcome, Leader", {
        description: "You have been signed in with Dev Mode"
      });
      navigate('/dashboard');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Error signing in with Google');
    }
  };

  const signOut = async () => {
    if (USE_FAKE_AUTH) {
      // Fake sign out - just redirect to login
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      toast("Signed out", {
        description: "You have been signed out"
      });
      navigate('/login');
      return;
    }

    try {
      await supabase.auth.signOut();
      toast("Signed out", {
        description: "You have been signed out successfully"
      });
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
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
