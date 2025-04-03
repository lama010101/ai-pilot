
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { USE_FAKE_AUTH } from '@/lib/supabaseClient';

const Header = () => {
  const { signOut } = useAuth();
  
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">AI Pilot</h1>
        <div className="ml-6 px-3 py-1 rounded-full bg-pilot-800 text-pilot-200 text-xs flex items-center">
          <span className="mr-2 h-2 w-2 rounded-full bg-secondary animate-pulse-light"></span>
          Phase 1
        </div>
        
        {USE_FAKE_AUTH && (
          <div className="ml-4 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
            Dev Mode
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={signOut}
          className={`p-2 rounded-md transition-colors ${USE_FAKE_AUTH ? 'text-muted-foreground hover:bg-muted/50' : 'hover:bg-muted'}`}
          aria-label="Log out"
          disabled={USE_FAKE_AUTH}
        >
          <LogOut size={18} className={USE_FAKE_AUTH ? 'opacity-50' : ''} />
        </button>
      </div>
    </header>
  );
};

export default Header;
