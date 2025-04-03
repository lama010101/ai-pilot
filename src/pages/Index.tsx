
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated) {
      // If user is authenticated, redirect to dashboard
      navigate('/dashboard');
    } else {
      // If user is not authenticated, redirect to login
      navigate('/login');
    }
  }, [navigate, isAuthenticated, isLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
        <p className="mt-4 text-pilot-200">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
