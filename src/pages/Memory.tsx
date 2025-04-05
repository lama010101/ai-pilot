
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LogsViewer from '@/components/memory/LogsViewer';
import SpecsViewer from '@/components/memory/SpecsViewer';

const Memory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('logs');
  
  return (
    <>
      <Helmet>
        <title>Memory | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Memory</h1>
          <p className="text-muted-foreground">
            AI system memory storage for logs, specifications, and learnings
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 w-[400px]">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="specs">Specs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>
                  Complete history of build and system logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogsViewer />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="specs" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>System Specifications</CardTitle>
                <CardDescription>
                  Technical specifications and architecture documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpecsViewer />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Memory;
