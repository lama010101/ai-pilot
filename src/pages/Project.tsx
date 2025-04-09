
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';

const Project: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isLeader = isAuthenticated && user?.email === import.meta.env.VITE_LEADER_EMAIL;
  const location = window.location.pathname;
  const isDev = location.includes('dashboard-dev');
  const baseUrl = isDev ? '/dashboard-dev' : '/dashboard';
  
  return (
    <>
      <Helmet>
        <title>Project | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project</h1>
            <p className="text-muted-foreground">
              Manage and view your current project
            </p>
          </div>
          
          {isLeader && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate(`${baseUrl}/settings/api-keys`)}
            >
              <Key size={16} />
              Manage API Keys
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  Summary of your current project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4">
                  <h3 className="text-lg font-medium mb-2">Project Configuration</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure the project settings and API keys for external services.
                  </p>
                  
                  {isLeader ? (
                    <div className="space-y-4">
                      <div className="flex items-center p-3 border rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium">API Keys</h4>
                          <p className="text-sm text-muted-foreground">
                            Configure API keys for external services like DALL·E, Midjourney, and more
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`${baseUrl}/settings/api-keys`)}
                          className="flex items-center gap-2"
                        >
                          <Key size={16} />
                          Manage Keys
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-md text-center">
                      <p className="text-muted-foreground">
                        Only the Leader can configure API keys and project settings.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="components" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Components</CardTitle>
                <CardDescription>
                  View and manage project components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="py-10 text-center text-muted-foreground">
                  Components view is currently being implemented...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="code" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Code</CardTitle>
                <CardDescription>
                  View and manage project code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="py-10 text-center text-muted-foreground">
                  Code view is currently being implemented...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Project;
