
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Memory from './pages/Memory';
import NotFound from './pages/NotFound';
import Builder from './pages/Builder';
import Pilot from './pages/Pilot';
import FinanceAI from './pages/FinanceAI';
import Project from './pages/Project';
import Unauthorized from './pages/Unauthorized';
import AgentDetail from './pages/AgentDetail';
import AppDetail from './pages/AppDetail';
import Apps from './pages/Apps';
import ApiKeysSettings from './pages/ApiKeysSettings';
import BudgetSettings from './pages/BudgetSettings';
import DeveloperSettings from './pages/DeveloperSettings';
import AuthGuard from './components/AuthGuard';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Index from './pages/Index';
import Features from './pages/Features';
import Greeting from './pages/Greeting';
import PlaceholderPage from './pages/PlaceholderPage';
import ImageUpload from './pages/ImageUpload';
import ApiSettings from './pages/ApiSettings';
import AppRoutes from './components/AppRoutes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
