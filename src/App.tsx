
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgentDetail from "./pages/AgentDetail";
import Unauthorized from "./pages/Unauthorized";
import DashboardLayout from "./components/DashboardLayout";
import PlaceholderPage from "./pages/PlaceholderPage";
import FinanceAI from "./pages/FinanceAI";
import BudgetSettings from "./pages/BudgetSettings";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { seedInitialAgents } from "./lib/supabaseService";

const queryClient = new QueryClient();

// Route guard component for any route
const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-pilot-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return element;
};

// App initialization component
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Initialize database with seed data
    const initializeApp = async () => {
      try {
        await seedInitialAgents();
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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="agents/:id" element={<AgentDetail />} />
                <Route path="agents/finance-ai" element={<FinanceAI />} />
                <Route path="agents" element={<PlaceholderPage title="Agents" />} />
                <Route path="logs" element={<PlaceholderPage title="Logs" />} />
                <Route path="memory" element={<PlaceholderPage title="Memory" />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                <Route path="settings/budget" element={<BudgetSettings />} />
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
