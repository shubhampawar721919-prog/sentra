import os

# 1. Dashboard.jsx
with open("frontend/src/pages/Dashboard.jsx", "w") as f:
    f.write("""import { useState, useEffect, useRef } from 'react';
import { Thermometer, Zap, Activity, Battery, Box, AlertTriangle } from 'lucide-react';
import StatusCard from '../components/StatusCard';
import TelemetryChart from '../components/TelemetryChart';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Dashboard() {
  const { selectedStation } = useStation();
  const [assets, setAssets] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const container = useRef();

  useGSAP(() => {
    if (!loading && !error && selectedStation) {
      const tl = gsap.timeline();
      tl.from('.dash-header', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
        .from('.dash-card', { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' }, '-=0.4')
        .from('.dash-chart', { y: 40, opacity: 0, duration: 0.6, stagger: 0.2, ease: 'power3.out' }, '-=0.2');
    }
  }, [loading, selectedStation]);

  useEffect(() => {
    if (selectedStation) {
      fetchDashboardData();
    }
  }, [selectedStation]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const assetsRes = await client.get(`/stations/${selectedStation._id}/assets`);
      const fetchedAssets = assetsRes.data.data;
      setAssets(fetchedAssets);

      const alertsRes = await client.get(`/alerts?stationId=${selectedStation._id}&status=ACTIVE`);
      setAlerts(alertsRes.data.data);

      const mainGenerator = fetchedAssets.find(a => a.type.includes('Generator') || a.assetId.includes('DG'));
      
      if (mainGenerator) {
        const telRes = await client.get(`/telemetry/${mainGenerator._id}?limit=24`);
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

  if (!selectedStation) return <div className="p-8 text-center text-muted">Loading station context...</div>;
  if (error) return <div className="p-8 text-center text-danger font-medium">{error}</div>;

  return (
    <div className="space-y-6" ref={container}>
      <div className="flex justify-between items-end mb-8 dash-header opacity-0">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">{selectedStation.name} Overview</h1>
          <p className="text-muted mt-1 font-medium">{selectedStation.location}</p>
        </div>
        <div className="text-sm font-medium text-primary bg-ice px-3 py-1 rounded border border-iceDark relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
          ● LIVE
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="dash-card opacity-0"><StatusCard title="Ext. Temperature" value="-14.2" unit="°C" icon={Thermometer} color="primary" trend={{ isPositive: false, value: 2.1 }}/></div>
        <div className="dash-card opacity-0"><StatusCard title="Power Output" value={telemetry.length > 0 ? Math.round(telemetry[telemetry.length-1].power) : '--'} unit="kW" icon={Zap} color="primary"/></div>
        <div className="dash-card opacity-0"><StatusCard title="Active Assets" value={assets.length} unit="" icon={Box} color="secondary"/></div>
        <div className="dash-card opacity-0"><StatusCard title="Active Alerts" value={alerts.length} unit="" icon={AlertTriangle} color={alerts.length > 0 ? "warning" : "secondary"}/></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="h-80 dash-chart opacity-0">
           <TelemetryChart data={telemetry} title="Main Generator Power (24h)" dataKey="power" color="#2563EB" unit="kW" />
        </div>
        <div className="h-80 dash-chart opacity-0">
           <TelemetryChart data={telemetry} title="Main Generator Vibration (24h)" dataKey="vibration" color="#38BDF8" unit="mm/s" />
        </div>
      </div>
    </div>
  );
}
""")

# 2. DigitalTwin.jsx
with open("frontend/src/pages/DigitalTwin.jsx", "w") as f:
    f.write("""import { useState, useEffect, useRef } from 'react';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import AssetDetailPanel from '../components/AssetDetailPanel';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function DigitalTwin() {
    const { selectedStation } = useStation();
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const container = useRef();

    useEffect(() => {
        if (selectedStation) fetchAssets();
    }, [selectedStation]);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 5000);
        return () => clearInterval(interval);
    }, []);

    useGSAP(() => {
        if (!loading && assets.length > 0) {
            const tl = gsap.timeline();
            tl.from('.dt-header', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
              .from('.dt-blueprint', { scale: 0.95, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
              .from('.dt-asset', { y: 20, opacity: 0, scale: 0.8, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }, '-=0.2');
        }
    }, [loading, assets]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await client.get(`/stations/${selectedStation._id}/assets`);
            setAssets(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'NORMAL': return 'bg-success shadow-[0_0_15px_rgba(22,163,74,0.5)]';
            case 'WARNING': return 'bg-warning shadow-[0_0_15px_rgba(245,158,11,0.5)]';
            case 'CRITICAL': return 'bg-danger shadow-[0_0_15px_rgba(220,38,38,0.5)]';
            default: return 'bg-muted';
        }
    };

    if (!selectedStation) return <div className="text-muted">Loading station context...</div>;

    return (
        <div className="h-full flex flex-col" ref={container}>
            <div className="flex justify-between items-center mb-6 dt-header opacity-0">
                <div>
                    <h1 className="text-3xl font-bold text-navy tracking-tight">Station Digital Twin</h1>
                    <p className="text-muted text-sm font-medium mt-1">2D Operational View</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Live Sync</span>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted">Initializing Digital Twin...</div>
            ) : (
                <div className="flex-1 bg-ice rounded-2xl border border-border relative overflow-hidden flex items-center justify-center shadow-inner dt-blueprint opacity-0">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#2563EB 1px, transparent 1px), linear-gradient(90deg, #2563EB 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    
                    <div className="relative w-full max-w-[900px] h-[550px] bg-white/90 backdrop-blur-sm rounded-lg border-2 border-primary/20 shadow-2xl p-10 grid grid-cols-3 gap-8">
                        <div className="absolute -top-4 left-8 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
                            {selectedStation.name} Facility
                        </div>

                        {assets.map((asset) => (
                            <div 
                                key={asset._id}
                                onClick={() => setSelectedAsset(asset)}
                                className="dt-asset opacity-0 bg-white border-2 border-border rounded-xl p-5 cursor-pointer hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative flex flex-col justify-between"
                            >
                                <div className="absolute -top-3 -right-3">
                                    <div className={`w-6 h-6 rounded-full border-[3px] border-white ${getStatusColor(asset.status)} transition-colors duration-500`}></div>
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-navy text-base mb-1 group-hover:text-primary transition-colors">{asset.name}</h3>
                                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider">{asset.type}</p>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-dashed border-border flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-primary font-bold">View Telemetry</span>
                                    <span className="text-xs text-muted">→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
        </div>
    );
}
""")

# 3. Sidebar.jsx
with open("frontend/src/components/Sidebar.jsx", "w") as f:
    f.write("""import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Box, Activity, AlertTriangle, BarChart2, Settings, Monitor, LogOut, User } from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import { useAuth } from '../contexts/AuthContext';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Digital Twin', path: '/digital-twin', icon: Monitor },
  { name: 'Assets', path: '/assets', icon: Box },
  { name: 'Telemetry', path: '/telemetry', icon: Activity },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
];

export default function Sidebar() {
  const { selectedStation } = useStation();
  const { user, logout } = useAuth();
  const container = useRef();

  useGSAP(() => {
    gsap.from('.sidebar-brand', { x: -20, opacity: 0, duration: 0.6, ease: 'power3.out' });
    gsap.from('.sidebar-item', { x: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 });
    gsap.from('.sidebar-footer', { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.5 });
  }, { scope: container });

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col h-full shadow-sm z-10" ref={container}>
      <div className="h-16 flex items-center justify-center border-b border-border bg-navy text-white sidebar-brand">
        <Activity className="text-cyan w-6 h-6 mr-2" />
        <span className="text-xl font-bold tracking-wider">POLARIS</span>
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="space-y-1 px-4">
          <div className="sidebar-item text-xs font-semibold text-muted uppercase tracking-wider mb-4 ml-2">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'bg-ice text-primary shadow-sm border border-iceDark translate-x-1' 
                      : 'text-navyLight hover:text-primary hover:bg-gray-50 hover:translate-x-1'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border bg-gray-50/50 sidebar-footer">
         <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">System Status</div>
         <div className="flex items-center text-sm text-navyLight mb-4 bg-white p-2 rounded border border-border shadow-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${selectedStation?.status === 'OPERATIONAL' ? 'bg-success' : 'bg-warning'}`}></div>
            <span className="truncate">{selectedStation ? `${selectedStation.name} Online` : 'No Station'}</span>
         </div>
      </div>
      
      <div className="p-4 border-t border-border bg-white sidebar-footer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-ice flex items-center justify-center text-primary font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="text-sm truncate">
              <p className="font-medium text-navy truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted truncate">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <button onClick={logout} className="p-1.5 text-muted hover:text-danger rounded-md hover:bg-gray-100 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
""")

# 4. AssetDetailPanel.jsx
with open("frontend/src/components/AssetDetailPanel.jsx", "w") as f:
    f.write("""import { X, Activity, AlertTriangle, Zap, Thermometer, Box } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function AssetDetailPanel({ asset, onClose }) {
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef();

    useGSAP(() => {
        if (asset) {
            gsap.fromTo(panelRef.current, 
                { x: '100%', opacity: 0.5 }, 
                { x: '0%', opacity: 1, duration: 0.5, ease: 'power3.out' }
            );
            gsap.from('.panel-item', { 
                y: 20, opacity: 0, duration: 0.4, stagger: 0.1, delay: 0.2, ease: 'power2.out' 
            });
        }
    }, [asset]);

    const handleClose = () => {
        gsap.to(panelRef.current, { x: '100%', opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: onClose });
    };

    useEffect(() => {
        if (asset) {
            fetchTelemetry();
        }
    }, [asset]);

    const fetchTelemetry = async () => {
        setLoading(true);
        try {
            const res = await client.get(`/telemetry/${asset._id}?limit=24`);
            const formatted = res.data.data.map(t => ({
                time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                temp: t.temperature || null,
                power: t.powerOutput || null,
                vibration: t.vibration || null,
                fuel: t.fuelLevel || null
            }));
            setTelemetry(formatted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!asset) return null;

    const intelligence = asset.intelligence || {};

    const getStatusColor = (status) => {
        switch(status) {
            case 'NORMAL': return 'text-success bg-success/10 border-success/20';
            case 'WARNING': return 'text-warning bg-warning/10 border-warning/20';
            case 'CRITICAL': return 'text-danger bg-danger/10 border-danger/20';
            default: return 'text-muted bg-gray-100 border-gray-200';
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-40" onClick={handleClose}></div>
            <div ref={panelRef} className="fixed inset-y-0 right-0 w-[420px] bg-surface border-l border-border shadow-2xl z-50 flex flex-col transform">
                <div className="flex items-center justify-between p-6 border-b border-border bg-gray-50/50">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
                            <Box className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-navy leading-tight">{asset.name}</h2>
                            <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-1">{asset.assetId} • {asset.type}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 text-muted hover:text-navy hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    <div className="flex space-x-4 panel-item opacity-0">
                        <div className={`flex-1 p-4 rounded-xl border ${getStatusColor(asset.status)} flex flex-col items-center justify-center text-center shadow-sm`}>
                            <span className="text-xs uppercase font-bold opacity-80 mb-1 tracking-wider">Status</span>
                            <span className="font-bold text-lg">{asset.status}</span>
                        </div>
                        <div className="flex-1 p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center shadow-sm">
                            <span className="text-xs uppercase font-bold text-muted mb-1 tracking-wider">Criticality</span>
                            <span className="font-bold text-navy text-lg">{asset.criticality}</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-ice to-white border border-iceDark rounded-xl p-5 shadow-sm panel-item opacity-0">
                        <h3 className="text-sm font-bold text-navy flex items-center mb-4">
                            <Activity className="w-4 h-4 mr-2 text-primary" />
                            AI Risk Prediction
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-border">
                                <div className="text-[10px] uppercase text-muted font-bold tracking-wider mb-1">Anomaly Score</div>
                                <div className="text-xl font-bold text-primary">{intelligence.anomaly?.score || '0.00'}</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-border">
                                <div className="text-[10px] uppercase text-muted font-bold tracking-wider mb-1">Risk Level</div>
                                <div className="text-xl font-bold text-navy">{intelligence.risk?.level || 'LOW'}</div>
                            </div>
                        </div>
                        <div className="text-xs text-navyLight bg-white p-3 rounded-lg border border-iceDark/50 leading-relaxed shadow-sm">
                            <strong className="text-primary block mb-1 uppercase tracking-wider text-[10px]">Recommendation</strong>
                            {intelligence.recommendation || "System operating nominally. No immediate actions required."}
                        </div>
                    </div>

                    <div className="panel-item opacity-0">
                        <h3 className="text-sm font-bold text-navy mb-4 border-b border-border pb-2">Recent Telemetry (24h)</h3>
                        {loading ? (
                            <div className="h-48 flex items-center justify-center text-muted text-sm bg-gray-50 rounded-xl border border-border">Loading telemetry...</div>
                        ) : telemetry.length > 0 ? (
                            <div className="h-56">
                                <TelemetryChart data={telemetry} dataKey={asset.type.includes('Generator') ? 'power' : 'temp'} color="#2563EB" hideTitle={true} />
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-muted text-sm bg-gray-50 rounded-xl border border-dashed border-gray-300">No telemetry data</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
""")

# 5. Login.jsx
with open("frontend/src/pages/Login.jsx", "w") as f:
    f.write("""import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Login() {
    const [email, setEmail] = useState('admin@polaris.gov');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const container = useRef();

    useGSAP(() => {
        gsap.from('.login-logo', { y: -30, opacity: 0, duration: 1, ease: 'bounce.out' });
        gsap.from('.login-box', { y: 30, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
        gsap.from('.bg-grid', { opacity: 0, duration: 2, ease: 'power2.inOut' });
    }, { scope: container });

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
        <div className="h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden" ref={container}>
            <div className="absolute inset-0 opacity-[0.03] bg-grid" style={{ backgroundImage: 'radial-gradient(#2563EB 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="mb-10 flex flex-col items-center relative z-10 login-logo opacity-0">
                <div className="bg-white p-5 rounded-3xl shadow-lg border border-border mb-6 group hover:shadow-xl transition-shadow cursor-default">
                    <Activity className="text-primary w-12 h-12 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h1 className="text-4xl font-extrabold text-navy tracking-widest drop-shadow-sm">POLARIS</h1>
                <p className="text-primary mt-2 font-bold tracking-[0.2em] text-xs uppercase">Digital Twin & Operations</p>
            </div>
            
            <div className="bg-surface border border-border p-10 rounded-[2rem] w-full max-w-md shadow-2xl relative z-10 login-box opacity-0">
                <h2 className="text-2xl text-navy font-bold mb-8 text-center">Mission Control Auth</h2>
                
                {error && <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm font-medium text-center">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-muted text-xs font-bold mb-2 uppercase tracking-wider">Operator Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-gray-50 border border-border text-navy font-medium rounded-xl p-4 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-muted text-xs font-bold mb-2 uppercase tracking-wider">Access Code</label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-50 border border-border text-navy font-medium rounded-xl p-4 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primaryLight hover:from-primaryLight hover:to-primary text-white font-bold py-4 rounded-xl transition-all mt-8 shadow-lg shadow-primary/30 transform hover:-translate-y-1"
                    >
                        Authenticate
                    </button>
                </form>
            </div>
        </div>
    );
}
""")

