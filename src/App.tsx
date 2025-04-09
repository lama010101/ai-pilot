
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './components/AppRoutes';
import PermanentNavbar from './components/PermanentNavbar';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <PermanentNavbar />
          <div className="flex-1">
            <AppRoutes />
          </div>
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
