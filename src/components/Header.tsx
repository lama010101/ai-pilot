
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();
  
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">AI Pilot</h1>
        <div className="ml-6 px-3 py-1 rounded-full bg-pilot-800 text-pilot-200 text-xs flex items-center">
          <span className="mr-2 h-2 w-2 rounded-full bg-secondary animate-pulse-light"></span>
          Phase 1
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <button 
              onClick={signOut}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
