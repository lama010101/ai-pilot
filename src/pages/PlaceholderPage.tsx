
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title, 
  description = "This page is currently under development" 
}) => {
  const location = useLocation();
  const isDev = location.pathname.includes('dashboard-dev');
  const baseUrl = isDev ? '/dashboard-dev' : '/dashboard';

  // Check if this is the settings page
  const isSettingsPage = location.pathname.endsWith('/settings');
  
  const settingsLinks = [
    { title: 'General Settings', path: `/settings`, description: 'Configure general system settings' },
    { title: 'Budget Management', path: `/settings/budget`, description: 'Manage system costs and budget limits' },
    { title: 'API Keys', path: `/settings/api-keys`, description: 'Configure API keys for external services' },
    { title: 'Developer Options', path: `/settings/developer`, description: 'Advanced configuration for developers' },
  ];

  return (
    <>
      <Helmet>
        <title>{title} | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">
          {description}
        </p>
        
        {isSettingsPage ? (
          <div className="grid gap-4 md:grid-cols-2">
            {settingsLinks.map((link) => (
              <Link to={`${baseUrl}${link.path}`} key={link.path}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex justify-between items-center">
                      {link.title}
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      {link.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Work in Progress</CardTitle>
              <CardDescription>
                This page is currently being developed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <div className="mb-4 bg-muted rounded-full p-4 inline-block">
                    <div className="w-16 h-16 rounded-full border-4 border-muted-foreground border-t-primary animate-spin"></div>
                  </div>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default PlaceholderPage;
