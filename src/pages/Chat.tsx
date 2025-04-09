
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Chat: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pilot');
  
  return (
    <>
      <Helmet>
        <title>Chat | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Chat</h1>
          <p className="text-muted-foreground">
            Chat with AI agents in the system
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-[400px]">
            <TabsTrigger value="pilot">Pilot</TabsTrigger>
            <TabsTrigger value="writer">Writer</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pilot" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Pilot Chat</CardTitle>
                <CardDescription>
                  Communicate with the Pilot AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="py-10 text-center text-muted-foreground">
                  Chat functionality is currently being implemented...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="writer" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Writer Chat</CardTitle>
                <CardDescription>
                  Communicate with the Writer AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="py-10 text-center text-muted-foreground">
                  Writer chat functionality is currently being implemented...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="builder" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Builder Chat</CardTitle>
                <CardDescription>
                  Communicate with the Builder AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="py-10 text-center text-muted-foreground">
                  Builder chat functionality is currently being implemented...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Chat;
