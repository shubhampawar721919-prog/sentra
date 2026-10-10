import os

os.makedirs("frontend/src/api", exist_ok=True)
os.makedirs("frontend/src/contexts", exist_ok=True)

with open("frontend/.env", "w") as f:
    f.write("VITE_API_URL=http://localhost:5001/api\n")
with open("frontend/.env.example", "w") as f:
    f.write("VITE_API_URL=http://localhost:5001/api\n")

# 1. API Client
with open("frontend/src/api/client.js", "w") as f:
    f.write("""import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    withCredentials: true // send cookies
});

export default client;
""")

# 2. Auth Context
with open("frontend/src/contexts/AuthContext.jsx", "w") as f:
    f.write("""import { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await client.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.data);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await client.post('/auth/login', { email, password });
        if (res.data.success) {
            setUser(res.data.data);
            return true;
        }
        return false;
    };

    const logout = async () => {
        await client.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
""")

# 3. Station Context
with open("frontend/src/contexts/StationContext.jsx", "w") as f:
    f.write("""import { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const StationContext = createContext();

export function StationProvider({ children }) {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        try {
            const res = await client.get('/stations');
            if (res.data.success) {
                setStations(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedStation(res.data.data[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch stations", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StationContext.Provider value={{ stations, selectedStation, setSelectedStation, loading }}>
            {children}
        </StationContext.Provider>
    );
}

export const useStation = () => useContext(StationContext);
""")

# 4. App.jsx (Wrap with Providers)
with open("frontend/src/App.jsx", "w") as f:
    f.write("""import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StationProvider } from './contexts/StationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Assets from './pages/Assets';
import DigitalTwin from './pages/DigitalTwin';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen bg-background text-white flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function App() {
  return (
    <AuthProvider>
      <StationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="assets" element={<Assets />} />
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

export default App;
""")

# 5. Navbar.jsx (Station Selector)
with open("frontend/src/components/Navbar.jsx", "w") as f:
    f.write("""import { Bell, User, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStation } from '../contexts/StationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { stations, selectedStation, setSelectedStation } = useStation();

  return (
    <header className="h-16 bg-surface border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center">
        <div className="flex items-center text-sm text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-700">
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          <select 
            className="bg-transparent border-none text-white focus:outline-none"
            value={selectedStation?._id || ''}
            onChange={(e) => {
                const s = stations.find(st => st._id === e.target.value);
                if (s) setSelectedStation(s);
            }}
          >
            {stations.map(s => (
                <option key={s._id} value={s._id}>{s.name} Station</option>
            ))}
          </select>
          <span className="mx-2 text-gray-600">|</span>
          <span className="text-secondary flex items-center">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2"></span>
            {selectedStation?.status === 'OPERATIONAL' ? 'Online' : selectedStation?.status || 'Unknown'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-surface"></span>
        </button>
        
        <div className="flex items-center space-x-2 pl-4 border-l border-gray-700">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400">{user?.role || 'Guest'}</p>
          </div>
          <button onClick={logout} className="ml-2 text-xs text-gray-500 hover:text-white">Logout</button>
        </div>
      </div>
    </header>
  );
}
""")

# 6. Login.jsx
with open("frontend/src/pages/Login.jsx", "w") as f:
    f.write("""import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('admin@polaris.gov');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred during login');
        }
    };

    return (
        <div className="h-screen bg-background flex flex-col items-center justify-center px-4">
            <div className="mb-8 flex flex-col items-center">
                <Activity className="text-primary w-12 h-12 mb-4" />
                <h1 className="text-3xl font-bold text-white tracking-widest">POLARIS</h1>
                <p className="text-gray-400 mt-2">Digital Twin & Remote Management</p>
            </div>
            
            <div className="bg-surface border border-gray-800 p-8 rounded-xl w-full max-w-md shadow-2xl">
                <h2 className="text-xl text-white font-medium mb-6">Mission Control Login</h2>
                
                {error && <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-2 rounded mb-4 text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-gray-900/50 border border-gray-700 text-white rounded p-2.5 focus:border-primary focus:outline-none"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-900/50 border border-gray-700 text-white rounded p-2.5 focus:border-primary focus:outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded transition-colors mt-4"
                    >
                        Authenticate
                    </button>
                </form>
            </div>
        </div>
    );
}
""")

# 7. Dashboard.jsx
with open("frontend/src/pages/Dashboard.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import { Thermometer, Zap, Activity, Battery } from 'lucide-react';
import StatusCard from '../components/StatusCard';
import TelemetryChart from '../components/TelemetryChart';
import AlertCard from '../components/AlertCard';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';

export default function Dashboard() {
  const { selectedStation } = useStation();
  const [assets, setAssets] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedStation) {
      fetchDashboardData();
    }
  }, [selectedStation]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch assets for the station
      const assetsRes = await client.get(`/stations/${selectedStation._id}/assets`);
      const fetchedAssets = assetsRes.data.data;
      setAssets(fetchedAssets);

      // Fetch alerts for the station
      const alertsRes = await client.get(`/alerts?stationId=${selectedStation._id}&status=ACTIVE`);
      setAlerts(alertsRes.data.data);

      // Find the main generator to show telemetry
      const mainGenerator = fetchedAssets.find(a => a.type.includes('Generator') || a.assetId.includes('DG'));
      
      if (mainGenerator) {
        const telRes = await client.get(`/telemetry/${mainGenerator._id}?limit=24`);
        // Format telemetry for Recharts
        const formatted = telRes.data.data.map(t => ({
          time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: t.temperature || 0,
          power: t.powerOutput || 0,
          vibration: t.vibration || 0
        }));
        setTelemetry(formatted);
      } else {
        setTelemetry([]);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load station data');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStation) return <div className="text-gray-400">Loading station...</div>;
  if (loading) return <div className="text-gray-400">Loading dashboard data...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">{selectedStation.name} Overview</h1>
        <div className="text-sm text-gray-400">Last updated: Just now</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard 
          title="Ext. Temperature" 
          value="-14.2" 
          unit="°C" 
          icon={Thermometer} 
          color="primary"
          trend={{ isPositive: false, value: 2.1 }}
        />
        <StatusCard 
          title="Active Assets" 
          value={assets.length}
          unit="" 
          icon={Activity} 
          color="secondary"
        />
        <StatusCard 
          title="Active Alerts" 
          value={alerts.length}
          unit="" 
          icon={AlertCard} 
          color={alerts.length > 0 ? "warning" : "secondary"}
        />
        <StatusCard 
          title="Station Status" 
          value={selectedStation.status} 
          unit="" 
          icon={Zap} 
          color={selectedStation.status === 'OPERATIONAL' ? "secondary" : "danger"}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {telemetry.length > 0 ? (
            <>
              <TelemetryChart 
                data={telemetry} 
                title="Generator Power Output (24h)" 
                dataKey="power" 
                color="#3B82F6" 
              />
              <TelemetryChart 
                data={telemetry} 
                title="Generator Vibration" 
                dataKey="vibration" 
                color="#10B981" 
              />
            </>
          ) : (
             <div className="bg-surface border border-gray-800 rounded-xl p-10 text-center text-gray-500">
                No telemetry data available for primary assets.
             </div>
          )}
        </div>
        
        <div className="space-y-6">
          <AlertCard alerts={alerts} />
          
          <div className="bg-surface border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">AI Risk Analysis</h3>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Current AI Prediction</span>
                <span className="px-2 py-0.5 rounded text-xs bg-secondary/20 text-secondary">Low Risk</span>
              </div>
              <p className="text-sm text-gray-300">
                [Mock Intelligence] All major systems functioning normally. Generator DG-001 shows minor vibration anomaly (score: 0.18), but well below critical threshold (0.8).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
""")

