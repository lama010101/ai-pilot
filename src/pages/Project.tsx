
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
              onClick={() => navigate('/dashboard/settings/api-keys')}
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
                <p className="py-10 text-center text-muted-foreground">
                  Project overview is currently being implemented...
                </p>
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
