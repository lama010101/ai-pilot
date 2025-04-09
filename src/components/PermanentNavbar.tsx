
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Coins, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const PermanentNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  
  // Extract current view name from the path
  const getCurrentViewName = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center space-x-4">
          <div className="font-bold text-lg text-primary">AI Pilot</div>
          <Separator orientation="vertical" className="h-6" />
          <div className="text-sm font-medium">{getCurrentViewName()}</div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={() => navigate('/settings/api')}>
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">API</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermanentNavbar;
