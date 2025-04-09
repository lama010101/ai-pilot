
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import DashboardLayout from "./components/DashboardLayout";
import DashboardDevLayout from "./components/DashboardDevLayout";
import Index from "./pages/Index";
import Greeting from "./pages/Greeting";

// Import all page components used in routes
import Pilot from "./pages/Pilot";
import AgentDetail from "./pages/AgentDetail";
import FinanceAI from "./pages/FinanceAI";
import PlaceholderPage from "./pages/PlaceholderPage";
import Apps from "./pages/Apps";
import AppDetail from "./pages/AppDetail";
import Memory from "./pages/Memory";
import Chat from "./pages/Chat";
import Builder from "./pages/Builder";
import ImageUpload from "./pages/ImageUpload";
import Project from "./pages/Project";
import BudgetSettings from "./pages/BudgetSettings";
import DeveloperSettings from "./pages/DeveloperSettings";
import ApiKeysSettings from "./pages/ApiKeysSettings";
import Features from "./pages/Features";

// Create a QueryClient instance
const queryClient = new QueryClient();

// App initialization component as a proper React component
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    // Initialize database with seed data
    const initializeApp = async () => {
      try {
        const { seedInitialAgents } = await import('./lib/supabase');
        const { initializeChatTable } = await import('./lib/chatService');
        const { peacefulHello } = await import('./utils/peacefulHello');
        
        await seedInitialAgents();
        await initializeChatTable(); 
        peacefulHello(); 
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };
    
    initializeApp();
  }, []);
  
  return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
  React.useEffect(() => {
    console.log("App component mounted");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppInitializer>
              <Toaster position="top-right" richColors closeButton />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/greeting" element={<Greeting />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Production Dashboard */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="/dashboard/pilot" replace />} />
                  <Route path="pilot" element={<Pilot />} />
                  <Route path="agents/:id" element={<AgentDetail />} />
                  <Route path="agents/finance-ai" element={<FinanceAI />} />
                  <Route path="agents" element={<PlaceholderPage title="Agents" />} />
                  <Route path="apps" element={<Apps />} />
                  <Route path="apps/:id" element={<AppDetail />} />
                  <Route path="memory" element={<Memory />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="builder" element={<Builder />} />
                  <Route path="images" element={<ImageUpload />} />
                  <Route path="project" element={<Project />} />
                  <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                  <Route path="settings/budget" element={<BudgetSettings />} />
                  <Route path="settings/developer" element={<DeveloperSettings />} />
                  <Route path="settings/api-keys" element={<ApiKeysSettings />} />
                  <Route path="features" element={<Features />} />
                </Route>
                
                {/* Development Dashboard */}
                <Route path="/dashboard-dev" element={<DashboardDevLayout />}>
                  <Route index element={<Navigate to="/dashboard-dev/pilot" replace />} />
                  <Route path="pilot" element={<Pilot />} />
                  <Route path="agents/:id" element={<AgentDetail />} />
                  <Route path="agents/finance-ai" element={<FinanceAI />} />
                  <Route path="agents" element={<PlaceholderPage title="Agents" />} />
                  <Route path="apps" element={<Apps />} />
                  <Route path="apps/:id" element={<AppDetail />} />
                  <Route path="memory" element={<Memory />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="builder" element={<Builder />} />
                  <Route path="images" element={<ImageUpload />} />
                  <Route path="project" element={<Project />} />
                  <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                  <Route path="settings/budget" element={<BudgetSettings />} />
                  <Route path="settings/developer" element={<DeveloperSettings />} />
                  <Route path="settings/api-keys" element={<ApiKeysSettings />} />
                  <Route path="features" element={<Features />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </AppInitializer>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
