import os
import json

# =========================================================================
# FRONTEND LAYER
# =========================================================================

# Ensure frontend dir exists (vite created it, but just in case)
os.makedirs("frontend/src/components", exist_ok=True)
os.makedirs("frontend/src/pages", exist_ok=True)
os.makedirs("frontend/src/assets", exist_ok=True)
os.makedirs("frontend/src/hooks", exist_ok=True)

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
        background: '#0B1121', // Dark blue/gray for that professional look
        surface: '#151E32',
        primary: '#3B82F6', // Blue
        secondary: '#10B981', // Emerald
        accent: '#8B5CF6', // Purple
        danger: '#EF4444',
        warning: '#F59E0B'
      }
    },
  },
  plugins: [],
}
""")

with open("frontend/postcss.config.js", "w") as f:
    f.write("""export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""")

with open("frontend/src/index.css", "w") as f:
    f.write("""@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0B1121;
  color: #F8FAFC;
}
""")

with open("frontend/src/main.jsx", "w") as f:
    f.write("""import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
""")

with open("frontend/src/App.jsx", "w") as f:
    f.write("""import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Assets from './pages/Assets';
import DigitalTwin from './pages/DigitalTwin';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
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
  );
}

export default App;
""")

with open("frontend/src/components/Layout.jsx", "w") as f:
    f.write("""import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-background text-white font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
""")

with open("frontend/src/components/Sidebar.jsx", "w") as f:
    f.write("""import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Box, Activity, AlertTriangle, BarChart2, Settings, Monitor } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Digital Twin', path: '/digital-twin', icon: Monitor },
  { name: 'Assets', path: '/assets', icon: Box },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-surface border-r border-gray-800 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Activity className="text-primary w-6 h-6 mr-2" />
        <span className="text-xl font-bold tracking-wider text-white">POLARIS</span>
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
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
      
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          Bharati Station (Active)
        </div>
      </div>
    </div>
  );
}
""")

with open("frontend/src/components/Navbar.jsx", "w") as f:
    f.write("""import { Bell, User, MapPin } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 bg-surface border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center">
        <div className="flex items-center text-sm text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-700">
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          <span>Bharati Research Station</span>
          <span className="mx-2 text-gray-600">|</span>
          <span className="text-secondary flex items-center">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2"></span>
            Online
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
            <p className="font-medium text-white">Cmdr. Sharma</p>
            <p className="text-xs text-gray-400">Mission Control</p>
          </div>
        </div>
      </div>
    </header>
  );
}
""")

with open("frontend/src/components/StatusCard.jsx", "w") as f:
    f.write("""export default function StatusCard({ title, value, unit, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  };

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline space-x-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-gray-500 text-sm">{unit}</span>}
      </div>
      
      {trend && (
        <div className={`text-xs mt-2 ${trend.isPositive ? 'text-secondary' : 'text-danger'}`}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}% from last hour
        </div>
      )}
    </div>
  );
}
""")

with open("frontend/src/components/AlertCard.jsx", "w") as f:
    f.write("""import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertCard({ alerts }) {
  const getIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="text-danger w-5 h-5" />;
      case 'WARNING': return <AlertCircle className="text-warning w-5 h-5" />;
      default: return <Info className="text-primary w-5 h-5" />;
    }
  };

  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-medium mb-4 flex items-center justify-between">
        Recent Alerts
        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{alerts.length} Active</span>
      </h3>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
            <div className="mr-3 mt-0.5">
              {getIcon(alert.severity)}
            </div>
            <div>
              <p className="text-sm text-gray-200">{alert.message}</p>
              <div className="flex space-x-3 mt-1 text-xs text-gray-500">
                <span>{alert.assetId}</span>
                <span>•</span>
                <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
""")

with open("frontend/src/components/TelemetryChart.jsx", "w") as f:
    f.write("""import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TelemetryChart({ data, title, dataKey, color }) {
  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-5 h-[300px] flex flex-col">
      <h3 className="text-white font-medium mb-4">{title}</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="time" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#151E32', borderColor: '#1f2937', color: '#fff' }}
              itemStyle={{ color: color }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
""")

with open("frontend/src/pages/Dashboard.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import { Thermometer, Zap, Activity, Battery } from 'lucide-react';
import StatusCard from '../components/StatusCard';
import TelemetryChart from '../components/TelemetryChart';
import AlertCard from '../components/AlertCard';

// Mock Data
const mockTelemetry = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  temp: -15 + Math.random() * 5,
  power: 450 + Math.random() * 50,
}));

const mockAlerts = [
  { id: 1, severity: 'WARNING', message: 'DG-001 vibration above baseline', assetId: 'DG-001', timestamp: Date.now() - 3600000 },
  { id: 2, severity: 'INFO', message: 'Routine maintenance scheduled for HVAC-001', assetId: 'HVAC-001', timestamp: Date.now() - 7200000 }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Station Overview</h1>
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
          title="Power Output" 
          value="485" 
          unit="kW" 
          icon={Zap} 
          color="secondary"
          trend={{ isPositive: true, value: 0.5 }}
        />
        <StatusCard 
          title="Overall Health" 
          value="98" 
          unit="%" 
          icon={Activity} 
          color="secondary"
        />
        <StatusCard 
          title="Fuel Reserve" 
          value="42" 
          unit="Days" 
          icon={Battery} 
          color="warning"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TelemetryChart 
            data={mockTelemetry} 
            title="Power Output Trend (24h)" 
            dataKey="power" 
            color="#3B82F6" 
          />
          <TelemetryChart 
            data={mockTelemetry} 
            title="External Temperature (°C)" 
            dataKey="temp" 
            color="#10B981" 
          />
        </div>
        
        <div className="space-y-6">
          <AlertCard alerts={mockAlerts} />
          
          <div className="bg-surface border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">AI Risk Analysis</h3>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Current AI Prediction</span>
                <span className="px-2 py-0.5 rounded text-xs bg-secondary/20 text-secondary">Low Risk</span>
              </div>
              <p className="text-sm text-gray-300">
                All major systems functioning normally. Generator DG-001 shows minor vibration anomaly (score: 0.18), but well below critical threshold (0.8).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
""")

with open("frontend/src/pages/Login.jsx", "w") as f:
    f.write("""export default function Login() { return <div className="p-10 text-white bg-background h-screen">Login Page Placeholder</div>; }""")
with open("frontend/src/pages/Assets.jsx", "w") as f:
    f.write("""export default function Assets() { return <div className="text-white">Assets Placeholder</div>; }""")
with open("frontend/src/pages/DigitalTwin.jsx", "w") as f:
    f.write("""export default function DigitalTwin() { return <div className="text-white">Digital Twin Placeholder</div>; }""")
with open("frontend/src/pages/Alerts.jsx", "w") as f:
    f.write("""export default function Alerts() { return <div className="text-white">Alerts Placeholder</div>; }""")
with open("frontend/src/pages/Analytics.jsx", "w") as f:
    f.write("""export default function Analytics() { return <div className="text-white">Analytics Placeholder</div>; }""")
with open("frontend/src/pages/Settings.jsx", "w") as f:
    f.write("""export default function Settings() { return <div className="text-white">Settings Placeholder</div>; }""")

