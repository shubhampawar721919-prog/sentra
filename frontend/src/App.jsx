import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StationProvider } from './contexts/StationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Assets from './pages/Assets';
import DigitalTwin from './pages/DigitalTwin';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import DecisionCenter from './pages/DecisionCenter';
import Settings from './pages/Settings';
import Telemetry from './pages/Telemetry';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen bg-background text-navy flex items-center justify-center font-bold">Loading Auth...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

// VITE_API_URL can now be the root URL directly from Render or same-origin in Docker
const defaultApiUrl =
    typeof window !== 'undefined' && window.location.port !== '5173'
        ? window.location.origin
        : 'http://localhost:5001';
const rawApiUrl = import.meta.env.VITE_API_URL || defaultApiUrl;
const backendUrl = rawApiUrl.replace(/\/api$/, ''); // Strip /api if it was manually included
const socket = io(backendUrl);

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleToast = (alert) => {
      toast.error(
        <div>
          <strong>New Operational Alert: {alert.assetName || alert.assetId}</strong><br/>
          {alert.severity} - {alert.message}
        </div>,
        { duration: 8000, position: 'top-right' }
      );
    };

    socket.on('alert:created', handleToast);
    
    return () => {
      socket.off('alert:created', handleToast);
    };
  }, []);

  return (
    <AuthProvider>
      <StationProvider>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <Router>
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              style: { zIndex: 999999, minWidth: '350px' } 
            }} 
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="decision-center" element={<DecisionCenter />} />
              <Route path="assets" element={<Assets />} />
              <Route path="telemetry" element={<Telemetry />} />
              <Route path="digital-twin" element={<DigitalTwin />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </StationProvider>
    </AuthProvider>
  );
}

export { socket };
export default App;
