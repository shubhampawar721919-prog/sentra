import os

# 1. Tailwind Config
with open("frontend/tailwind.config.js", "w") as f:
    f.write("""/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7FAFC',
        surface: '#FFFFFF',
        ice: '#EAF6FF',
        iceDark: '#DFF2FF',
        primary: '#2563EB',
        primaryLight: '#2F80ED',
        navy: '#0F2742',
        navyLight: '#163A5F',
        cyan: '#38BDF8',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        muted: '#64748B',
        border: '#D9E7F2'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
""")

# 2. Global CSS
with open("frontend/src/index.css", "w") as f:
    f.write("""@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  background-color: #F7FAFC;
  color: #0F2742;
  font-family: 'Inter', sans-serif;
}

/* Custom Scrollbar for a clean look */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
""")

# 3. Sidebar
with open("frontend/src/components/Sidebar.jsx", "w") as f:
    f.write("""import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Box, Activity, AlertTriangle, BarChart2, Settings, Monitor, LogOut, User } from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import { useAuth } from '../contexts/AuthContext';

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

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col h-full shadow-sm z-10">
      <div className="h-16 flex items-center justify-center border-b border-border bg-navy text-white">
        <Activity className="text-cyan w-6 h-6 mr-2" />
        <span className="text-xl font-bold tracking-wider">POLARIS</span>
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="space-y-1 px-4">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 ml-2">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-ice text-primary shadow-sm border border-iceDark' 
                      : 'text-navyLight hover:text-primary hover:bg-gray-50'
                  }`
                }
              >
                <Icon className={`w-5 h-5 mr-3 ${/* conditional styling could go here */ ''}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border bg-gray-50/50">
         <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">System Status</div>
         <div className="flex items-center text-sm text-navyLight mb-4 bg-white p-2 rounded border border-border shadow-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${selectedStation?.status === 'OPERATIONAL' ? 'bg-success' : 'bg-warning'}`}></div>
            <span className="truncate">{selectedStation ? `${selectedStation.name} Online` : 'No Station'}</span>
         </div>
      </div>
      
      <div className="p-4 border-t border-border bg-white">
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

# 4. Navbar
with open("frontend/src/components/Navbar.jsx", "w") as f:
    f.write("""import { Bell, MapPin } from 'lucide-react';
import { useStation } from '../contexts/StationContext';

export default function Navbar() {
  const { stations, selectedStation, setSelectedStation } = useStation();

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 shadow-sm z-10 sticky top-0">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-navy mr-6 hidden md:block">Antarctic Station Operations</h1>
        
        <div className="flex items-center text-sm bg-gray-50 px-3 py-1.5 rounded-md border border-border shadow-sm hover:border-gray-300 transition-colors cursor-pointer">
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          <select 
            className="bg-transparent border-none text-navy font-medium focus:outline-none cursor-pointer pr-4"
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
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-muted hover:text-navy transition-colors bg-gray-50 rounded-full border border-transparent hover:border-border">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-surface"></span>
        </button>
      </div>
    </header>
  );
}
""")

# 5. Asset Detail Panel Reusable Component
with open("frontend/src/components/AssetDetailPanel.jsx", "w") as f:
    f.write("""import { X, Activity, AlertTriangle, Zap, Thermometer, Box } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { useState, useEffect } from 'react';
import client from '../api/client';

export default function AssetDetailPanel({ asset, onClose }) {
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);

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
        <div className="fixed inset-y-0 right-0 w-96 bg-surface border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
            <div className="flex items-center justify-between p-5 border-b border-border bg-gray-50/50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg border border-border shadow-sm">
                        <Box className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-navy leading-tight">{asset.name}</h2>
                        <p className="text-xs text-muted">{asset.assetId} • {asset.type}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-muted hover:text-navy hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Status Section */}
                <div className="flex space-x-3">
                    <div className={`flex-1 p-3 rounded-lg border ${getStatusColor(asset.status)} flex flex-col items-center justify-center text-center`}>
                        <span className="text-xs uppercase font-bold opacity-80 mb-1">Status</span>
                        <span className="font-bold">{asset.status}</span>
                    </div>
                    <div className="flex-1 p-3 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center">
                        <span className="text-xs uppercase font-bold text-muted mb-1">Criticality</span>
                        <span className="font-bold text-navy">{asset.criticality}</span>
                    </div>
                </div>

                {/* Intelligence Section */}
                <div className="bg-ice border border-iceDark rounded-lg p-4">
                    <h3 className="text-sm font-bold text-navy flex items-center mb-3">
                        <Activity className="w-4 h-4 mr-2 text-primary" />
                        AI Risk Prediction
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white p-2 rounded shadow-sm border border-border">
                            <div className="text-[10px] uppercase text-muted font-bold">Anomaly Score</div>
                            <div className="text-lg font-bold text-navy">{intelligence.anomaly?.score || '0.00'}</div>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border border-border">
                            <div className="text-[10px] uppercase text-muted font-bold">Risk Level</div>
                            <div className="text-lg font-bold text-navy">{intelligence.risk?.level || 'LOW'}</div>
                        </div>
                    </div>
                    <p className="text-xs text-navyLight bg-white/50 p-2 rounded border border-iceDark/50">
                        <strong>Recommendation:</strong> {intelligence.recommendation || "System operating nominally."}
                    </p>
                </div>

                {/* Telemetry Chart */}
                <div>
                    <h3 className="text-sm font-bold text-navy mb-3 border-b border-border pb-2">Recent Telemetry (24h)</h3>
                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-muted text-sm">Loading telemetry...</div>
                    ) : telemetry.length > 0 ? (
                        <div className="h-48">
                            <TelemetryChart data={telemetry} dataKey={asset.type.includes('Generator') ? 'power' : 'temp'} color="#2563EB" hideTitle={true} />
                        </div>
                    ) : (
                        <div className="h-20 flex items-center justify-center text-muted text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">No telemetry data</div>
                    )}
                </div>

                {/* Specifications */}
                {asset.specifications && (
                    <div>
                        <h3 className="text-sm font-bold text-navy mb-3 border-b border-border pb-2">Specifications</h3>
                        <div className="bg-gray-50 rounded-lg p-3 border border-border text-sm">
                            {Object.entries(asset.specifications).map(([k, v]) => (
                                <div key={k} className="flex justify-between py-1">
                                    <span className="text-muted capitalize">{k}</span>
                                    <span className="font-medium text-navy">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
""")

# 6. Telemetry Chart Component (Update for light theme)
with open("frontend/src/components/TelemetryChart.jsx", "w") as f:
    f.write("""import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TelemetryChart({ data, title, dataKey, color, hideTitle, unit }) {
  return (
    <div className={`bg-surface ${hideTitle ? '' : 'border border-border rounded-xl p-5 shadow-sm'} h-full flex flex-col`}>
      {!hideTitle && <h3 className="text-navy font-bold mb-4">{title}</h3>}
      <div className="flex-1 w-full h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="time" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9E7F2', color: '#0F2742', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: color, fontWeight: 'bold' }}
              labelStyle={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}
              formatter={(value) => [value + (unit ? ` ${unit}` : ''), dataKey]}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: color }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
""")

