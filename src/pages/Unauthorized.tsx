
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="rounded-full bg-destructive/20 p-3 w-12 h-12 flex items-center justify-center mx-auto">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-destructive"
          >
            <path d="M17 7 7 17M7 7l10 10"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          Sorry, you don't have permission to access the AI Pilot dashboard. 
          This system is restricted to authorized personnel only.
        </p>
        <div className="pt-4">
          <Button asChild variant="outline">
            <Link to="/login" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Return to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
