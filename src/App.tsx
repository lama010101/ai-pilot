
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { seedInitialAgents } from "./lib/supabase";
import { initializeChatTable } from "./lib/chatService";
import { peacefulHello } from "./utils/peacefulHello";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgentDetail from "./pages/AgentDetail";
import Unauthorized from "./pages/Unauthorized";
import DashboardLayout from "./components/DashboardLayout";
import DashboardDevLayout from "./components/DashboardDevLayout";
import PlaceholderPage from "./pages/PlaceholderPage";
import FinanceAI from "./pages/FinanceAI";
import BudgetSettings from "./pages/BudgetSettings";
import Apps from "./pages/Apps";
import AppDetail from "./pages/AppDetail";
import DeveloperSettings from "./pages/DeveloperSettings";
import Chat from "./pages/Chat";
import Greeting from "./pages/Greeting";
import Builder from "./pages/Builder";
import Features from "./pages/Features";
import Index from "./pages/Index";

const queryClient = new QueryClient();

// App initialization component
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Initialize database with seed data
    const initializeApp = async () => {
      try {
        await seedInitialAgents();
        await initializeChatTable(); // Initialize the chat table
        peacefulHello(); // Log our peaceful hello world
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };
    
    initializeApp();
  }, []);
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppInitializer>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/greeting" element={<Greeting />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Production Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="agents/:id" element={<AgentDetail />} />
                <Route path="agents/finance-ai" element={<FinanceAI />} />
                <Route path="agents" element={<PlaceholderPage title="Agents" />} />
                <Route path="apps" element={<Apps />} />
                <Route path="apps/:id" element={<AppDetail />} />
                <Route path="logs" element={<PlaceholderPage title="Logs" />} />
                <Route path="memory" element={<PlaceholderPage title="Memory" />} />
                <Route path="chat" element={<Chat />} />
                <Route path="builder" element={<Builder />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="settings/budget" element={<BudgetSettings />} />
                <Route path="settings/developer" element={<DeveloperSettings />} />
                <Route path="features" element={<Features />} />
              </Route>
              
              {/* Development Dashboard */}
              <Route path="/dashboard-dev" element={<DashboardDevLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="agents/:id" element={<AgentDetail />} />
                <Route path="agents/finance-ai" element={<FinanceAI />} />
                <Route path="agents" element={<PlaceholderPage title="Agents" />} />
                <Route path="apps" element={<Apps />} />
                <Route path="apps/:id" element={<AppDetail />} />
                <Route path="logs" element={<PlaceholderPage title="Logs" />} />
                <Route path="memory" element={<PlaceholderPage title="Memory" />} />
                <Route path="chat" element={<Chat />} />
                <Route path="builder" element={<Builder />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="settings/budget" element={<BudgetSettings />} />
                <Route path="settings/developer" element={<DeveloperSettings />} />
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

export default App;
