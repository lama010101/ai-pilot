
import { useLocation } from 'react-router-dom';

const PlaceholderPage = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop();
  
  // Capitalize the first letter of the page name
  const formattedPageName = pageName 
    ? pageName.charAt(0).toUpperCase() + pageName.slice(1) 
    : 'Page';

  return (
    <div className="h-full flex flex-col items-center justify-center py-20">
      <div className="bg-pilot-600/10 text-pilot-500 p-4 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15.5 2H12a10 10 0 0 0 0 20h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.76a10 10 0 0 0 .76-4V4a2 2 0 0 0-2-2Z"></path>
          <circle cx="7" cy="12" r="5"></circle>
        </svg>
      </div>
      <h1 className="text-2xl font-bold mt-6">{formattedPageName} Module</h1>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        This module is currently in development and will be available in a future update.
      </p>
    </div>
  );
};

export default PlaceholderPage;
