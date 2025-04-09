
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

function App() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } 
          />
          <Route
            path="/chat"
            element={
              <AuthGuard>
                <Chat />
              </AuthGuard>
            }
          />
          <Route
            path="/memory"
            element={
              <AuthGuard>
                <Memory />
              </AuthGuard>
            }
          />
          <Route 
            path="/builder" 
            element={
              <AuthGuard>
                <Builder />
              </AuthGuard>
            } 
          />
          <Route 
            path="/pilot" 
            element={
              <AuthGuard>
                <Pilot />
              </AuthGuard>
            } 
          />
          <Route 
            path="/security" 
            element={
              <AuthGuard>
                <PlaceholderPage title="Security AI" />
              </AuthGuard>
            } 
          />
          <Route 
            path="/testing" 
            element={
              <AuthGuard>
                <PlaceholderPage title="Testing AI" />
              </AuthGuard>
            } 
          />
          <Route 
            path="/ethics" 
            element={
              <AuthGuard>
                <PlaceholderPage title="Ethics AI" />
              </AuthGuard>
            } 
          />
          <Route 
            path="/finance" 
            element={
              <AuthGuard>
                <FinanceAI />
              </AuthGuard>
            } 
          />
          <Route 
            path="/project" 
            element={
              <AuthGuard>
                <Project />
              </AuthGuard>
            } 
          />
          <Route 
            path="/unauthorized" 
            element={<Unauthorized />} 
          />
          <Route 
            path="/agent/:id" 
            element={
              <AuthGuard>
                <AgentDetail />
              </AuthGuard>
            } 
          />
          <Route 
            path="/app/:id" 
            element={
              <AuthGuard>
                <AppDetail />
              </AuthGuard>
            } 
          />
          <Route 
            path="/apps" 
            element={
              <AuthGuard>
                <Apps />
              </AuthGuard>
            } 
          />
          <Route 
            path="/settings/api-keys" 
            element={
              <AuthGuard>
                <ApiKeysSettings />
              </AuthGuard>
            } 
          />
          <Route 
            path="/settings/budget" 
            element={
              <AuthGuard>
                <BudgetSettings />
              </AuthGuard>
            } 
          />
          <Route 
            path="/settings/developer" 
            element={
              <AuthGuard>
                <DeveloperSettings />
              </AuthGuard>
            } 
          />
          <Route 
            path="/greeting" 
            element={
              <AuthGuard>
                <Greeting />
              </AuthGuard>
            } 
          />
          <Route 
            path="/image-upload" 
            element={
              <AuthGuard>
                <ImageUpload />
              </AuthGuard>
            } 
          />
          <Route 
            path="/settings/api" 
            element={
              <AuthGuard>
                <ApiSettings />
              </AuthGuard>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
