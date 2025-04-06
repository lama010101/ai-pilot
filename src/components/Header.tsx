
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { USE_FAKE_AUTH } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
  extraButtons?: React.ReactNode;
}

const Header = ({ extraButtons }: HeaderProps) => {
  const { signOut, user } = useAuth();
  
  // Extract first letter of email for avatar fallback
  const getInitial = () => {
    if (!user?.email) return 'L';
    return user.email.charAt(0).toUpperCase();
  };
  
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">AI Pilot</h1>
        <div className="ml-6 px-3 py-1 rounded-full bg-pilot-800 text-pilot-200 text-xs flex items-center">
          <span className="mr-2 h-2 w-2 rounded-full bg-secondary animate-pulse-light"></span>
          Phase 1
        </div>
        
        {USE_FAKE_AUTH && (
          <div className="ml-4 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
            Dev Mode
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {extraButtons}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{getInitial()}</AvatarFallback>
              </Avatar>
              {!USE_FAKE_AUTH && user?.email && (
                <span className="text-sm hidden md:inline">{user.email}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You are logged in as the Leader</p>
          </TooltipContent>
        </Tooltip>
        
        <button 
          onClick={signOut}
          className={`p-2 rounded-md transition-colors ${USE_FAKE_AUTH ? 'text-muted-foreground hover:bg-muted/50' : 'hover:bg-muted'}`}
          aria-label="Log out"
        >
          <LogOut size={18} className={USE_FAKE_AUTH ? 'opacity-50' : ''} />
        </button>
      </div>
    </header>
  );
};

export default Header;
