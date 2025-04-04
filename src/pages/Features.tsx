
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, PlusCircle, Code2, LineChart, SendToBack } from 'lucide-react';

const Features = () => {
  return (
    <>
      <Helmet>
        <title>Features | AI Pilot DEV</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Internal Feature Builder</h1>
        </div>
        
        <p className="text-muted-foreground max-w-3xl">
          Use the Builder to create new features for the AI Pilot dashboard, agents, and systems.
          This area is only visible in development mode for internal feature development.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>UI Components</CardTitle>
              <CardDescription>Build and test new UI components for the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Create reusable components that can be integrated into the main dashboard.
              </p>
              <Button className="w-full" variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Component
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Agent Features</CardTitle>
              <CardDescription>Develop new capabilities for Pilot agents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Build and test new AI agent features before promoting to production.
              </p>
              <Button className="w-full" variant="outline">
                <Code2 className="mr-2 h-4 w-4" />
                New Agent Feature
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Analytics Tools</CardTitle>
              <CardDescription>Build better monitoring and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Create advanced analytics dashboards and monitoring tools.
              </p>
              <Button className="w-full" variant="outline">
                <LineChart className="mr-2 h-4 w-4" />
                New Analytics Feature
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>Improve core pilot systems</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Design and implement improvements to the core Pilot architecture.
              </p>
              <Button className="w-full" variant="outline">
                <SendToBack className="mr-2 h-4 w-4" />
                System Feature
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <h3 className="text-yellow-800 font-medium mb-2">Development Notes</h3>
          <p className="text-yellow-700 text-sm">
            This area is only available in the DEV dashboard. Features built here can be tested
            safely without affecting the production environment. Use the environment switcher
            at the top of the page to toggle between DEV and PROD.
          </p>
        </div>
      </div>
    </>
  );
};

export default Features;
