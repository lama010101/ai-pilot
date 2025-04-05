
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Code, Wrench, Rocket } from 'lucide-react';

const Features = () => {
  return (
    <>
      <Helmet>
        <title>Feature Development | AI Pilot DEV</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" />
            Internal Feature Development
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and test new features for the AI Pilot dashboard and agent system
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-500" />
                Builder Enhancements
              </CardTitle>
              <CardDescription>Improve the AI app builder</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Enhance the build process, add new templates, and improve code generation.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Open in Builder
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-500" />
                Agent Tools
              </CardTitle>
              <CardDescription>New capabilities for agents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Develop new tools and APIs that agents can use to perform tasks.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Prototype Tool
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-green-500" />
                Deployment Systems
              </CardTitle>
              <CardDescription>Improve app deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Test new deployment options, hosting providers, and CI/CD pipelines.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Test Deploy
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Development Logs</CardTitle>
            <CardDescription>
              Recent feature development activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="py-2 border-b border-border">
                <div className="flex justify-between">
                  <span className="font-medium">Build History Expansion</span>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Added collapsible build history with status indicators
                </p>
              </div>
              
              <div className="py-2 border-b border-border">
                <div className="flex justify-between">
                  <span className="font-medium">Dev Dashboard</span>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Created development dashboard with Features tab
                </p>
              </div>
              
              <div className="py-2">
                <div className="flex justify-between">
                  <span className="font-medium">Toast Removal</span>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Replaced toast notifications with proper logging
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Features;
