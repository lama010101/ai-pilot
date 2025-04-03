
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate('/login');
      setIsRedirecting(false);
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {isRedirecting && (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
          <p className="mt-4 text-pilot-200">Redirecting to login...</p>
        </div>
      )}
    </div>
  );
};

export default Index;

