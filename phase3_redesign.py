import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.strip() + '\n')

BASE_DIR = '/Users/atharvasharna/Desktop/Polaris'

files = {
    'frontend/tailwind.config.js': """
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0D1117', subtle: '#161B22', elevated: '#1C2331' },
        blue: { DEFAULT: '#3B82F6', dim: '#1D4ED8', glow: 'rgba(59,130,246,0.15)' },
        cyan: { DEFAULT: '#22D3EE', dim: '#0E7490' },
        green: { DEFAULT: '#10B981', dim: '#065F46', glow: 'rgba(16,185,129,0.15)' },
        amber: { DEFAULT: '#F59E0B', dim: '#92400E' },
        red: { DEFAULT: '#EF4444', dim: '#7F1D1D', glow: 'rgba(239,68,68,0.15)' },
        txt: { primary: '#F0F6FF', secondary: '#8B949E', muted: '#484F58' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59,130,246,0.3)',
        'glow-green': '0 0 20px rgba(16,185,129,0.3)',
        'glow-red': '0 0 20px rgba(239,68,68,0.3)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.3)',
      }
    },
  },
  plugins: [],
}
""",

    'frontend/src/index.css': """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

body {
  background-color: #0D1117;
  color: #F0F6FF;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

/* Glass utility */
.glass {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
}

/* Glow utilities */
.glow-blue { box-shadow: 0 0 24px rgba(59,130,246,0.3); }
.glow-green { box-shadow: 0 0 24px rgba(16,185,129,0.3); }
.glow-red { box-shadow: 0 0 24px rgba(239,68,68,0.3); }
.glow-amber { box-shadow: 0 0 24px rgba(245,158,11,0.3); }

/* Live pulse ring */
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  70% { transform: scale(2); opacity: 0; }
  100% { transform: scale(2); opacity: 0; }
}
.live-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #10B981;
  animation: pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite;
}

/* Blueprint grid for digital twin */
.blueprint-grid {
  background-color: #0D1117;
  background-image:
    linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px),
    linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
}
""",

    'frontend/src/components/Layout.jsx': """
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
""",

    'frontend/src/components/Sidebar.jsx': """
import { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Cpu, Database, Activity, ShieldAlert, BarChart3, Settings2, LogOut, Radio, User2 } from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import { useAuth } from '../contexts/AuthContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Digital Twin', path: '/digital-twin', icon: Cpu },
  { name: 'Assets', path: '/assets', icon: Database },
  { name: 'Telemetry', path: '/telemetry', icon: Activity },
  { name: 'Alerts', path: '/alerts', icon: ShieldAlert },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings2 },
];

export default function Sidebar() {
  const { selectedStation } = useStation();
  const { user, logout } = useAuth();
  const container = useRef();

  useGSAP(() => {
    gsap.from('.nav-item', {
      x: -20, opacity: 0, duration: 0.4,
      stagger: 0.06, ease: 'power2.out', delay: 0.1
    });
    gsap.from('.sidebar-logo', { x: -20, opacity: 0, duration: 0.5, ease: 'power2.out' });
    gsap.from('.sidebar-bottom', { y: 10, opacity: 0, duration: 0.5, delay: 0.5, ease: 'power2.out' });
  }, { scope: container });

  return (
    <div ref={container} className="w-60 flex flex-col h-full bg-bg-subtle border-r border-white/[0.06] shrink-0">
      {/* Logo */}
      <div className="sidebar-logo opacity-0 h-16 flex items-center px-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 bg-blue rounded-lg flex items-center justify-center mr-3 shadow-glow-blue shrink-0">
          <Radio className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-txt-primary font-bold text-sm tracking-widest">POLARIS</div>
          <div className="text-txt-muted text-[10px] tracking-wider uppercase">Mission Control</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `nav-item opacity-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-blue bg-blue/10 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue before:rounded-r-full'
                    : 'text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom opacity-0 border-t border-white/[0.06] p-3 space-y-2">
        {/* Station Status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated">
          <div className="relative shrink-0">
            <div className={`w-2 h-2 rounded-full ${selectedStation?.status === 'OPERATIONAL' ? 'bg-green' : 'bg-amber'}`}></div>
          </div>
          <span className="text-xs text-txt-secondary font-medium truncate">{selectedStation?.name || 'No Station'} online</span>
        </div>
        {/* User */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
          <div className="w-7 h-7 rounded-full bg-blue/20 flex items-center justify-center shrink-0">
            <User2 className="w-3.5 h-3.5 text-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-txt-primary truncate">{user?.name || 'Operator'}</div>
            <div className="text-[10px] text-txt-muted truncate">{user?.role}</div>
          </div>
          <button onClick={logout} className="p-1 text-txt-muted hover:text-red transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
""",

    'frontend/src/components/Navbar.jsx': """
import { Bell, MapPin, ChevronDown } from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const pageTitles = {
  '/dashboard': 'Overview',
  '/digital-twin': 'Digital Twin',
  '/assets': 'Asset Management',
  '/telemetry': 'Telemetry',
  '/alerts': 'Alerts',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function Navbar() {
  const { stations, selectedStation, setSelectedStation } = useStation();
  const location = useLocation();
  const container = useRef();

  useGSAP(() => {
    gsap.from(container.current, { y: -10, opacity: 0, duration: 0.5, ease: 'power2.out' });
  }, { scope: container });

  const title = pageTitles[location.pathname] || 'POLARIS';

  return (
    <header ref={container} className="h-14 shrink-0 flex items-center justify-between px-8 bg-bg-subtle/80 backdrop-blur-md border-b border-white/[0.06] z-20">
      <h1 className="text-base font-semibold text-txt-primary tracking-wide">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Station selector */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-bg-elevated border border-white/[0.08] rounded-lg px-3 py-1.5 hover:border-blue/50 transition-colors cursor-pointer">
            <MapPin className="w-3.5 h-3.5 text-blue shrink-0" />
            <select
              className="bg-transparent text-txt-primary text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-4"
              value={selectedStation?._id || ''}
              onChange={e => {
                const s = stations.find(st => st._id === e.target.value);
                if (s) setSelectedStation(s);
              }}
            >
              {stations.map(s => (
                <option key={s._id} value={s._id} className="bg-bg-elevated">{s.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-txt-muted shrink-0" />
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green/10 border border-green/20 rounded-lg">
          <div className="relative w-2 h-2">
            <div className="w-2 h-2 rounded-full bg-green"></div>
          </div>
          <span className="text-green text-xs font-bold tracking-widest">LIVE</span>
        </div>

        {/* Bell */}
        <button className="relative p-2 text-txt-muted hover:text-txt-primary bg-bg-elevated rounded-lg border border-white/[0.06] hover:border-white/20 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full border-2 border-bg-subtle"></span>
        </button>
      </div>
    </header>
  );
}
""",

    'frontend/src/pages/Login.jsx': """
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Radio, ArrowRight, Thermometer, Zap, Shield, Globe } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const stats = [
  { icon: Globe, label: 'Research Stations', value: '2' },
  { icon: Zap, label: 'Monitored Assets', value: '5' },
  { icon: Thermometer, label: 'Ambient Temp', value: '-14°C' },
  { icon: Shield, label: 'System Status', value: 'Secure' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@polaris.gov');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const container = useRef();

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.login-left', { x: -40, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .from('.login-right', { x: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.stat-item', { y: 20, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' }, '-=0.4');
  }, { scope: container });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) navigate('/dashboard');
      else setError('Invalid credentials. Try again.');
    } catch {
      setError('Connection failed. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={container} className="h-screen bg-bg blueprint-grid flex overflow-hidden">
      {/* Left Panel */}
      <div className="login-left opacity-0 hidden lg:flex flex-col justify-center w-[55%] px-20 border-r border-white/[0.06] bg-bg/80">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-14 h-14 bg-blue rounded-2xl flex items-center justify-center shadow-glow-blue">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-widest text-txt-primary">POLARIS</h1>
            <p className="text-txt-muted text-sm tracking-wider uppercase">Antarctic Operations Platform</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-txt-primary leading-tight mb-4">
          Digital twin for<br />
          <span className="text-blue">Antarctica's</span> research stations.
        </h2>
        <p className="text-txt-secondary text-base leading-relaxed mb-12 max-w-md">
          Real-time monitoring, predictive maintenance, and intelligent operations management for India's polar research infrastructure.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="stat-item opacity-0 flex items-center gap-3 p-4 bg-bg-subtle border border-white/[0.06] rounded-xl">
              <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue" />
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-txt-primary">{value}</div>
                <div className="text-xs text-txt-muted">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right opacity-0 flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 bg-blue rounded-xl flex items-center justify-center shadow-glow-blue">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-widest text-txt-primary">POLARIS</h1>
          </div>

          <h2 className="text-xl font-bold text-txt-primary mb-2">Welcome back</h2>
          <p className="text-txt-secondary text-sm mb-8">Sign in to access Mission Control</p>

          {error && (
            <div className="bg-red/10 border border-red/30 text-red px-4 py-3 rounded-xl text-sm mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-txt-muted uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg-elevated border border-white/[0.08] text-txt-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue/60 focus:ring-1 focus:ring-blue/30 transition-all placeholder-txt-muted"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-txt-muted uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-bg-elevated border border-white/[0.08] text-txt-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue/60 focus:ring-1 focus:ring-blue/30 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue hover:bg-blue-dim text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-glow-blue hover:shadow-glow-blue mt-2 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : (<>Authenticate <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
""",

    'frontend/src/components/StatusCard.jsx': """
const colorConfig = {
  blue: { text: 'text-blue', bg: 'bg-blue/10', border: 'border-blue/20', glow: 'hover:shadow-glow-blue', bar: 'from-blue to-cyan' },
  green: { text: 'text-green', bg: 'bg-green/10', border: 'border-green/20', glow: 'hover:shadow-glow-green', bar: 'from-green to-cyan' },
  amber: { text: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/20', glow: 'hover:glow-amber', bar: 'from-amber to-yellow-400' },
  red: { text: 'text-red', bg: 'bg-red/10', border: 'border-red/20', glow: 'hover:shadow-glow-red', bar: 'from-red to-rose-400' },
};

export default function StatusCard({ title, value, unit, icon: Icon, trend, color = 'blue' }) {
  const c = colorConfig[color] || colorConfig.blue;
  return (
    <div className={`relative bg-bg-elevated border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-300 cursor-default hover:border-white/20 ${c.glow} group`}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.bar}`}></div>
      <div className="p-5 pt-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-txt-muted">{title}</p>
          <div className={`p-2 rounded-lg ${c.bg} ${c.border} border`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold font-mono ${c.text}`}>{value}</span>
          {unit && <span className="text-txt-muted text-sm font-medium">{unit}</span>}
        </div>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-green' : 'text-red'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}% from last reading
          </p>
        )}
      </div>
    </div>
  );
}
""",

    'frontend/src/components/TelemetryChart.jsx': """
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-elevated border border-white/[0.12] rounded-xl px-4 py-3 shadow-xl">
        <p className="text-txt-muted text-xs mb-1">{label}</p>
        <p className="font-mono font-bold text-sm" style={{ color }}>
          {payload[0].value?.toFixed(2)}{unit ? ` ${unit}` : ''}
        </p>
      </div>
    );
  }
  return null;
};

export default function TelemetryChart({ data, title, dataKey, color = '#3B82F6', unit, hideTitle }) {
  const gradientId = `grad-${dataKey}-${color.replace('#', '')}`;
  return (
    <div className={`h-full flex flex-col ${hideTitle ? '' : 'bg-bg-elevated border border-white/[0.06] rounded-xl overflow-hidden'}` }>
      {!hideTitle && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-txt-primary">{title}</h3>
          {unit && <span className="text-xs font-mono text-txt-muted px-2 py-0.5 bg-bg rounded-md border border-white/[0.06]">{unit}</span>}
        </div>
      )}
      <div className="flex-1 px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" stroke="transparent" tick={{ fill: '#484F58', fontSize: 10 }} tickLine={false} />
            <YAxis stroke="transparent" tick={{ fill: '#484F58', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip unit={unit} color={color} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: color }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
""",

    'frontend/src/pages/Dashboard.jsx': """
import { useState, useEffect, useRef } from 'react';
import { Thermometer, Zap, Box, ShieldAlert, TrendingUp, Cpu } from 'lucide-react';
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
    if (!loading && !error) {
      const tl = gsap.timeline();
      tl.from('.dash-hero', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
        .from('.dash-card', { y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(1.3)' }, '-=0.3')
        .from('.dash-chart', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, '-=0.2')
        .from('.dash-alert', { x: 20, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, '-=0.3');
    }
  }, [loading]);

  useEffect(() => { if (selectedStation) fetchData(); }, [selectedStation]);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [assetsRes, alertsRes] = await Promise.all([
        client.get(`/stations/${selectedStation._id}/assets`),
        client.get(`/alerts?stationId=${selectedStation._id}&status=ACTIVE`),
      ]);
      const fetchedAssets = assetsRes.data.data;
      setAssets(fetchedAssets);
      setAlerts(alertsRes.data.data.slice(0, 5));

      const gen = fetchedAssets.find(a => a.type?.includes('Generator') || a.assetId?.includes('DG'));
      if (gen) {
        const telRes = await client.get(`/telemetry/${gen._id}?limit=24`);
        setTelemetry(telRes.data.data.map(t => ({
          time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          power: t.powerOutput || 0,
          vibration: t.vibration || 0,
        })));
      }
    } catch { setError('Failed to load station data.'); }
    finally { setLoading(false); }
  };

  const severityColor = s => ({ CRITICAL: 'text-red border-l-red', HIGH: 'text-red border-l-red', MEDIUM: 'text-amber border-l-amber', LOW: 'text-blue border-l-blue' }[s] || 'text-txt-secondary');

  if (loading) return <div className="flex items-center justify-center h-64 text-txt-muted text-sm">Loading station data...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red text-sm">{error}</div>;

  return (
    <div ref={container} className="space-y-8">
      {/* Hero */}
      <div className="dash-hero opacity-0 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-txt-muted px-2 py-1 bg-bg-elevated rounded-md border border-white/[0.06]">STATION</span>
            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
              selectedStation?.status === 'OPERATIONAL'
                ? 'text-green bg-green/10 border-green/30'
                : 'text-amber bg-amber/10 border-amber/30'
            }`}>{selectedStation?.status}</span>
          </div>
          <h1 className="text-4xl font-black text-txt-primary tracking-tight">{selectedStation?.name}</h1>
          <p className="text-txt-muted mt-1">{selectedStation?.location || 'Antarctica'}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-txt-muted">Last synced</div>
          <div className="text-sm font-mono text-txt-secondary">Just now</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dash-card opacity-0"><StatusCard title="Ext. Temperature" value="-14.2" unit="°C" icon={Thermometer} color="blue" /></div>
        <div className="dash-card opacity-0"><StatusCard title="Power Output" value={telemetry.at(-1)?.power?.toFixed(0) ?? '--'} unit="kW" icon={Zap} color="green" /></div>
        <div className="dash-card opacity-0"><StatusCard title="Active Assets" value={assets.length} icon={Box} color="blue" /></div>
        <div className="dash-card opacity-0"><StatusCard title="Active Alerts" value={alerts.length} icon={ShieldAlert} color={alerts.length > 2 ? 'red' : alerts.length > 0 ? 'amber' : 'green'} /></div>
      </div>

      {/* Charts + Alerts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="dash-chart opacity-0 h-64"><TelemetryChart data={telemetry} title="Power Output" dataKey="power" color="#3B82F6" unit="kW" /></div>
          <div className="dash-chart opacity-0 h-64"><TelemetryChart data={telemetry} title="Vibration" dataKey="vibration" color="#22D3EE" unit="mm/s" /></div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-bg-elevated border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-txt-primary">Recent Alerts</h3>
            <span className="text-xs text-txt-muted">{alerts.length} active</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {alerts.length === 0 && (
              <div className="p-6 text-center text-txt-muted text-sm">No active alerts</div>
            )}
            {alerts.map(a => (
              <div key={a._id} className={`dash-alert opacity-0 px-5 py-4 border-l-2 ${severityColor(a.severity)}`}>
                <p className="text-sm text-txt-primary font-medium leading-snug">{a.message}</p>
                <p className="text-xs text-txt-muted mt-1">{a.assetId?.name || 'Unknown'} • {new Date(a.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
""",

    'frontend/src/pages/Assets.jsx': """
import { useState, useEffect, useRef } from 'react';
import { Search, Database } from 'lucide-react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import AssetDetailPanel from '../components/AssetDetailPanel';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const STATUS_FILTERS = ['ALL', 'NORMAL', 'WARNING', 'CRITICAL'];

const statusStyle = {
  NORMAL: { text: 'text-green', bg: 'bg-green/10', border: 'border-green/30', leftBorder: 'border-l-green' },
  WARNING: { text: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/30', leftBorder: 'border-l-amber' },
  CRITICAL: { text: 'text-red', bg: 'bg-red/10', border: 'border-red/30', leftBorder: 'border-l-red' },
};

export default function Assets() {
  const { selectedStation } = useStation();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const container = useRef();

  useGSAP(() => {
    if (!loading) {
      gsap.from('.asset-header', { y: -16, opacity: 0, duration: 0.5, ease: 'power2.out' });
      gsap.from('.asset-card', { y: 24, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'back.out(1.2)', delay: 0.2 });
    }
  }, [loading]);

  useEffect(() => { if (selectedStation) fetchAssets(); }, [selectedStation]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/stations/${selectedStation._id}/assets`);
      setAssets(res.data.data);
    } catch { } finally { setLoading(false); }
  };

  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.assetId.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div ref={container} className="space-y-6">
      <div className="asset-header opacity-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Asset Management</h1>
          <p className="text-txt-muted text-sm mt-1">{assets.length} assets at {selectedStation?.name}</p>
        </div>
      </div>

      <div className="asset-header opacity-0 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            placeholder="Search assets..."
            className="w-full bg-bg-elevated border border-white/[0.08] text-txt-primary rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue/60 focus:ring-1 focus:ring-blue/30 transition-all placeholder-txt-muted"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-bg-elevated border border-white/[0.08] rounded-xl p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-blue text-white shadow-glow-blue' : 'text-txt-muted hover:text-txt-primary'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-txt-muted">Loading assets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(asset => {
            const s = statusStyle[asset.status] || statusStyle.NORMAL;
            return (
              <div
                key={asset._id}
                onClick={() => setSelectedAsset(asset)}
                className={`asset-card opacity-0 bg-bg-elevated border border-white/[0.06] border-l-[3px] ${s.leftBorder} rounded-xl p-5 cursor-pointer hover:border-white/20 hover:bg-bg-elevated/80 transition-all duration-200 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-txt-primary group-hover:text-blue transition-colors">{asset.name}</h3>
                    <p className="text-xs font-mono text-txt-muted mt-0.5">{asset.assetId}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${s.text} ${s.bg} ${s.border}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.text.replace('text-', 'bg-')}`}></div>
                    {asset.status}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-muted bg-bg rounded-md px-2 py-1 border border-white/[0.06]">{asset.type}</span>
                  <span className={`text-xs font-bold ${s.text}`}>{asset.criticality}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Database className="w-10 h-10 text-txt-muted mx-auto mb-3" />
              <p className="text-txt-muted text-sm">No assets found</p>
            </div>
          )}
        </div>
      )}
      {selectedAsset && <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
    </div>
  );
}
""",

    'frontend/src/pages/Alerts.jsx': """
import { useState, useEffect, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const sevStyle = {
  CRITICAL: { text: 'text-red', bg: 'bg-red/10', border: 'border-red/30', leftBorder: 'border-l-red' },
  HIGH: { text: 'text-red', bg: 'bg-red/5', border: 'border-red/20', leftBorder: 'border-l-red' },
  MEDIUM: { text: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/30', leftBorder: 'border-l-amber' },
  LOW: { text: 'text-blue', bg: 'bg-blue/10', border: 'border-blue/30', leftBorder: 'border-l-blue' },
};

export default function Alerts() {
  const { selectedStation } = useStation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const container = useRef();

  useGSAP(() => {
    if (!loading) {
      gsap.from('.alert-header', { y: -16, opacity: 0, duration: 0.5, ease: 'power2.out' });
      gsap.from('.alert-row', { x: -16, opacity: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.2 });
    }
  }, [loading]);

  useEffect(() => { if (selectedStation) fetchAlerts(); }, [selectedStation]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/alerts?stationId=${selectedStation._id}`);
      setAlerts(res.data.data);
    } catch { } finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try { await client.patch(`/alerts/${id}`, { status }); fetchAlerts(); } catch { }
  };

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  alerts.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

  return (
    <div ref={container} className="space-y-6">
      <div className="alert-header opacity-0">
        <h1 className="text-2xl font-bold text-txt-primary">System Alerts</h1>
        <p className="text-txt-muted text-sm mt-1">{alerts.length} total alerts</p>
      </div>

      {/* Summary */}
      <div className="alert-header opacity-0 grid grid-cols-4 gap-3">
        {Object.entries(counts).map(([sev, count]) => {
          const s = sevStyle[sev] || sevStyle.LOW;
          return (
            <div key={sev} className={`bg-bg-elevated border ${s.border} rounded-xl p-4 flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <ShieldAlert className={`w-4 h-4 ${s.text}`} />
              </div>
              <div>
                <div className={`text-xl font-black font-mono ${s.text}`}>{count}</div>
                <div className="text-xs text-txt-muted font-bold">{sev}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="alert-header opacity-0 bg-bg-elevated border border-white/[0.06] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-txt-muted">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-txt-muted mx-auto mb-3" />
            <p className="text-txt-muted">No alerts found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.06]">
              <tr className="text-txt-muted text-xs font-bold uppercase tracking-widest">
                <th className="px-5 py-3 text-left">Severity</th>
                <th className="px-5 py-3 text-left">Message</th>
                <th className="px-5 py-3 text-left">Asset</th>
                <th className="px-5 py-3 text-left">Time</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {alerts.map(alert => {
                const s = sevStyle[alert.severity] || sevStyle.LOW;
                return (
                  <tr key={alert._id} className={`alert-row opacity-0 border-l-2 ${s.leftBorder} hover:bg-white/[0.02] transition-colors`}>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${s.text} ${s.bg} ${s.border}`}>{alert.severity}</span>
                    </td>
                    <td className="px-5 py-4 text-txt-primary font-medium">{alert.message}</td>
                    <td className="px-5 py-4 text-txt-secondary font-mono text-xs">{alert.assetId?.name || '—'}</td>
                    <td className="px-5 py-4 text-txt-muted text-xs">{new Date(alert.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-txt-muted tracking-wide">{alert.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === 'ACTIVE' && (
                          <button onClick={() => updateStatus(alert._id, 'ACKNOWLEDGED')}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue/10 text-blue border border-blue/30 hover:bg-blue/20 transition-colors">
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'RESOLVED' && (
                          <button onClick={() => updateStatus(alert._id, 'RESOLVED')}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green/10 text-green border border-green/30 hover:bg-green/20 transition-colors">
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
""",

    'frontend/src/pages/Telemetry.jsx': """
import { useState, useEffect, useRef } from 'react';
import TelemetryChart from '../components/TelemetryChart';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import { Activity, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const RANGES = [{ label: '1H', value: 1 }, { label: '6H', value: 6 }, { label: '12H', value: 12 }, { label: '24H', value: 24 }];

export default function Telemetry() {
  const { selectedStation } = useStation();
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [range, setRange] = useState(24);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const container = useRef();

  useGSAP(() => {
    if (!loading) {
      gsap.from('.tel-top', { y: -16, opacity: 0, duration: 0.5, ease: 'power2.out' });
      gsap.from('.tel-chart', { y: 24, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out', delay: 0.2 });
    }
  }, [loading, selectedAssetId, range]);

  useEffect(() => { if (selectedStation) loadAssets(); }, [selectedStation]);
  useEffect(() => { if (selectedAssetId) loadTelemetry(); }, [selectedAssetId, range]);

  const loadAssets = async () => {
    try {
      const res = await client.get(`/stations/${selectedStation._id}/assets`);
      setAssets(res.data.data);
      if (res.data.data.length > 0) setSelectedAssetId(res.data.data[0]._id);
    } catch { }
  };

  const loadTelemetry = async () => {
    setLoading(true); setError(null);
    try {
      const res = await client.get(`/telemetry/${selectedAssetId}?limit=${range}`);
      setTelemetry(res.data.data.map(t => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        power: t.powerOutput || 0, vibration: t.vibration || 0,
        load: t.generatorLoad || 0, fuel: t.fuelLevel || 0, temp: t.temperature || 0,
      })));
    } catch { setError('Failed to load telemetry.'); }
    finally { setLoading(false); }
  };

  const currentAsset = assets.find(a => a._id === selectedAssetId);
  const isGen = currentAsset?.type?.includes('Generator') || currentAsset?.assetId?.includes('DG');

  return (
    <div ref={container} className="space-y-6">
      <div className="tel-top opacity-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Telemetry</h1>
          <p className="text-txt-muted text-sm mt-1">Real-time sensor data</p>
        </div>
        <button onClick={loadTelemetry} className="flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-white/[0.08] rounded-xl text-txt-secondary hover:text-txt-primary hover:border-white/20 transition-all text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="tel-top opacity-0 flex items-center gap-4 bg-bg-elevated border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-widest text-txt-muted">Asset</label>
          <select
            className="bg-bg border border-white/[0.1] text-txt-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue/50 cursor-pointer"
            value={selectedAssetId}
            onChange={e => setSelectedAssetId(e.target.value)}
          >
            {assets.map(a => <option key={a._id} value={a._id} className="bg-bg-elevated">{a.name} ({a.assetId})</option>)}
          </select>
        </div>
        <div className="h-6 w-px bg-white/[0.08]"></div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-widest text-txt-muted">Range</label>
          <div className="flex gap-1 bg-bg p-1 rounded-lg border border-white/[0.08]">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  range === r.value ? 'bg-blue text-white shadow-glow-blue' : 'text-txt-muted hover:text-txt-primary'
                }`}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-txt-muted"><Activity className="w-8 h-8 mx-auto mb-3 animate-pulse" />Loading telemetry...</div>
      ) : error ? (
        <div className="text-center py-20 text-red">{error}</div>
      ) : telemetry.length === 0 ? (
        <div className="text-center py-20 text-txt-muted">No telemetry data available.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {isGen ? (
            <>
              <div className="tel-chart opacity-0 h-72"><TelemetryChart data={telemetry} title="Power Output" dataKey="power" color="#3B82F6" unit="kW" /></div>
              <div className="tel-chart opacity-0 h-72"><TelemetryChart data={telemetry} title="Vibration" dataKey="vibration" color="#22D3EE" unit="mm/s" /></div>
              <div className="tel-chart opacity-0 h-72"><TelemetryChart data={telemetry} title="Generator Load" dataKey="load" color="#F59E0B" unit="%" /></div>
              <div className="tel-chart opacity-0 h-72"><TelemetryChart data={telemetry} title="Fuel Level" dataKey="fuel" color="#10B981" unit="%" /></div>
            </>
          ) : (
            <div className="col-span-2 tel-chart opacity-0 h-72"><TelemetryChart data={telemetry} title="Temperature" dataKey="temp" color="#EF4444" unit="°C" /></div>
          )}
        </div>
      )}
    </div>
  );
}
""",

    'frontend/src/pages/DigitalTwin.jsx': """
import { useState, useEffect, useRef } from 'react';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import AssetDetailPanel from '../components/AssetDetailPanel';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Cpu, Zap, Wind, Battery, Fuel } from 'lucide-react';

const typeConfig = {
  Generator: { icon: Zap, color: 'blue', label: 'POWER GENERATION' },
  HVAC: { icon: Wind, color: 'cyan', label: 'CLIMATE CONTROL' },
  Battery: { icon: Battery, color: 'green', label: 'ENERGY STORAGE' },
  Fuel: { icon: Fuel, color: 'amber', label: 'FUEL SYSTEMS' },
};

const statusConfig = {
  NORMAL: { color: '#10B981', glow: 'shadow-glow-green', ring: 'border-green/40', bg: 'bg-green/10' },
  WARNING: { color: '#F59E0B', glow: 'shadow-glow-amber', ring: 'border-amber/40', bg: 'bg-amber/10' },
  CRITICAL: { color: '#EF4444', glow: 'shadow-glow-red', ring: 'border-red/40', bg: 'bg-red/10' },
};

export default function DigitalTwin() {
  const { selectedStation } = useStation();
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const container = useRef();

  useGSAP(() => {
    if (!loading) {
      gsap.from('.dt-header', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' });
      gsap.from('.asset-node', {
        scale: 0.6, opacity: 0, duration: 0.6,
        stagger: { amount: 0.5 }, ease: 'back.out(1.7)', delay: 0.3
      });
    }
  }, [loading]);

  useEffect(() => { if (selectedStation) fetchAssets(); }, [selectedStation]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/stations/${selectedStation._id}/assets`);
      setAssets(res.data.data);
    } catch { } finally { setLoading(false); }
  };

  const getTypeConfig = (type) => {
    const key = Object.keys(typeConfig).find(k => type?.includes(k)) || 'Generator';
    return typeConfig[key];
  };

  return (
    <div ref={container} className="flex flex-col h-full space-y-5">
      <div className="dt-header opacity-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Digital Twin</h1>
          <p className="text-txt-muted text-sm mt-1">Interactive station model — {selectedStation?.name}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green/10 border border-green/30 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse"></div>
          <span className="text-green text-xs font-bold tracking-widest">LIVE SYNC</span>
        </div>
      </div>

      <div className="flex-1 blueprint-grid rounded-2xl border border-white/[0.06] relative overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-txt-muted">
            <Cpu className="w-8 h-8 animate-pulse mr-3" /> Initializing Digital Twin...
          </div>
        ) : (
          <>
            {/* Station name overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-bg-elevated/80 backdrop-blur-sm border border-white/[0.1] rounded-xl px-4 py-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue">{selectedStation?.name} Research Facility</span>
              </div>
            </div>

            {/* Asset grid */}
            <div className="absolute inset-0 flex items-center justify-center p-16">
              <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                {assets.map(asset => {
                  const tc = getTypeConfig(asset.type);
                  const sc = statusConfig[asset.status] || statusConfig.NORMAL;
                  const Icon = tc?.icon || Cpu;
                  return (
                    <div
                      key={asset._id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`asset-node opacity-0 relative bg-bg-elevated/90 backdrop-blur-sm border ${sc.ring} rounded-2xl p-5 cursor-pointer hover:scale-105 transition-all duration-300 group ${sc.glow}`}
                    >
                      {/* Pulse dot */}
                      <div className="absolute top-4 right-4">
                        <div className="relative w-3 h-3">
                          <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: sc.color }}></div>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sc.color }}></div>
                        </div>
                      </div>

                      <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center mb-4`}>
                        <Icon className="w-5 h-5" style={{ color: sc.color }} />
                      </div>

                      <div className="font-mono text-xs text-txt-muted mb-1">{asset.assetId}</div>
                      <div className="font-bold text-txt-primary text-sm group-hover:text-blue transition-colors">{asset.name}</div>
                      <div className="text-xs text-txt-muted mt-1">{asset.type}</div>

                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: sc.color }}>{asset.status}</span>
                        <span className="text-xs text-txt-muted">{asset.criticality}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      {selectedAsset && <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
    </div>
  );
}
""",

    'frontend/src/components/AssetDetailPanel.jsx': """
import { X, Box, Activity } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const statusConfig = {
  NORMAL: { text: 'text-green', bg: 'bg-green/10', border: 'border-green/30' },
  WARNING: { text: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/30' },
  CRITICAL: { text: 'text-red', bg: 'bg-red/10', border: 'border-red/30' },
};

export default function AssetDetailPanel({ asset, onClose }) {
  const [telemetry, setTelemetry] = useState([]);
  const [telLoading, setTelLoading] = useState(true);
  const panelRef = useRef();

  useGSAP(() => {
    if (asset && panelRef.current) {
      gsap.fromTo(panelRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
      gsap.from('.panel-content > *', { y: 16, opacity: 0, stagger: 0.07, duration: 0.4, delay: 0.15, ease: 'power2.out' });
    }
  }, [asset]);

  const handleClose = () => {
    gsap.to(panelRef.current, { x: 60, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: onClose });
  };

  useEffect(() => { if (asset) loadTelemetry(); }, [asset]);

  const loadTelemetry = async () => {
    setTelLoading(true);
    try {
      const res = await client.get(`/telemetry/${asset._id}?limit=24`);
      setTelemetry(res.data.data.map(t => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        power: t.powerOutput || 0, vibration: t.vibration || 0, temp: t.temperature || 0,
      })));
    } catch { } finally { setTelLoading(false); }
  };

  if (!asset) return null;

  const sc = statusConfig[asset.status] || statusConfig.NORMAL;
  const intel = asset.intelligence || {};
  const isGen = asset.type?.includes('Generator') || asset.assetId?.includes('DG');

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={handleClose} />
      <div ref={panelRef} className="fixed inset-y-0 right-0 w-[480px] bg-bg-subtle border-l border-white/[0.08] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${sc.bg} border ${sc.border}`}>
              <Box className={`w-5 h-5 ${sc.text}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-txt-primary">{asset.name}</h2>
              <p className="text-xs font-mono text-txt-muted mt-0.5">{asset.assetId} • {asset.type}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="panel-content space-y-6">
            {/* Status badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border ${sc.border} ${sc.bg} text-center`}>
                <div className="text-xs font-bold uppercase tracking-widest text-txt-muted mb-1">Status</div>
                <div className={`text-lg font-black ${sc.text}`}>{asset.status}</div>
              </div>
              <div className="p-4 rounded-xl border border-white/[0.08] bg-bg-elevated text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-txt-muted mb-1">Criticality</div>
                <div className="text-lg font-black text-txt-primary">{asset.criticality}</div>
              </div>
            </div>

            {/* Intelligence */}
            <div className="bg-blue/[0.05] border border-blue/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-blue" />
                <span className="text-sm font-bold text-txt-primary">AI Risk Analysis</span>
                <span className="ml-auto text-xs text-txt-muted px-2 py-0.5 bg-bg rounded border border-white/[0.06]">MOCK</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-bg-elevated rounded-lg p-3">
                  <div className="text-xs text-txt-muted font-bold uppercase tracking-wider mb-1">Anomaly Score</div>
                  <div className="text-2xl font-black font-mono text-blue">{intel.anomaly?.score ?? '0.00'}</div>
                </div>
                <div className="bg-bg-elevated rounded-lg p-3">
                  <div className="text-xs text-txt-muted font-bold uppercase tracking-wider mb-1">Risk Level</div>
                  <div className="text-2xl font-black font-mono text-txt-primary">{intel.risk?.level ?? 'LOW'}</div>
                </div>
              </div>
              <div className="bg-bg-elevated rounded-lg p-3 text-sm text-txt-secondary leading-relaxed">
                {intel.recommendation ?? 'System operating nominally. No immediate actions required.'}
              </div>
            </div>

            {/* Telemetry chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-txt-primary">Recent Telemetry (24h)</h3>
              </div>
              {telLoading ? (
                <div className="h-44 bg-bg-elevated rounded-xl flex items-center justify-center text-txt-muted text-sm">Loading...</div>
              ) : telemetry.length > 0 ? (
                <div className="h-52">
                  <TelemetryChart data={telemetry} dataKey={isGen ? 'power' : 'temp'} color={isGen ? '#3B82F6' : '#EF4444'} hideTitle />
                </div>
              ) : (
                <div className="h-24 bg-bg-elevated rounded-xl border border-dashed border-white/[0.1] flex items-center justify-center text-txt-muted text-sm">
                  No telemetry data
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
""",

    'frontend/src/components/AlertCard.jsx': """
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertCard({ alerts = [] }) {
  const getStyle = (severity) => {
    switch(severity) {
      case 'CRITICAL': case 'HIGH': return { icon: AlertTriangle, color: 'text-red', bg: 'bg-red/10' };
      case 'MEDIUM': return { icon: AlertCircle, color: 'text-amber', bg: 'bg-amber/10' };
      default: return { icon: Info, color: 'text-blue', bg: 'bg-blue/10' };
    }
  };
  return (
    <div className="bg-bg-elevated border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-txt-primary">Recent Alerts</h3>
        <span className="text-xs text-txt-muted">{alerts.length} active</span>
      </div>
      <div className="space-y-2">
        {alerts.map(a => { const { icon: Icon, color, bg } = getStyle(a.severity); return (
          <div key={a._id || a.id} className={`flex items-start gap-3 p-3 ${bg} rounded-lg`}>
            <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm text-txt-primary">{a.message}</p>
              <p className="text-xs text-txt-muted mt-0.5">{a.assetId?.name || a.assetId} • {new Date(a.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ); })}
        {alerts.length === 0 && <p className="text-txt-muted text-sm text-center py-4">No active alerts</p>}
      </div>
    </div>
  );
}
""",

    'frontend/src/pages/Analytics.jsx': """
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue/10 border border-blue/30 rounded-full text-blue text-xs font-bold uppercase tracking-widest mb-4">
          Coming in Phase 4
        </div>
        <h1 className="text-2xl font-bold text-txt-primary">Analytics</h1>
        <p className="text-txt-muted text-sm mt-1">Advanced analytics and reporting</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {['Failure Prediction', 'Energy Trends', 'Maintenance Schedule', 'Asset Health Score', 'Anomaly History', 'Station Comparison'].map(title => (
          <div key={title} className="bg-bg-elevated border border-white/[0.06] rounded-xl p-5 h-48 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-txt-secondary">{title}</span>
              <BarChart3 className="w-4 h-4 text-txt-muted" />
            </div>
            <div className="flex-1 bg-bg rounded-lg border border-white/[0.04] flex items-center justify-center">
              <span className="text-xs text-txt-muted">Available Phase 4</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
""",

    'frontend/src/pages/Settings.jsx': """
import { useAuth } from '../contexts/AuthContext';
import { useStation } from '../contexts/StationContext';
import { User2, MapPin, Bell, Shield } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-bg-elevated border border-white/[0.06] rounded-xl overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
      <Icon className="w-4 h-4 text-blue" />
      <h2 className="text-sm font-bold text-txt-primary">{title}</h2>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-txt-muted">{label}</span>
    <span className="text-sm font-medium text-txt-primary font-mono">{value || '—'}</span>
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const { selectedStation } = useStation();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-txt-primary">Settings</h1>
        <p className="text-txt-muted text-sm mt-1">System configuration and account management</p>
      </div>
      <Section icon={User2} title="Account">
        <Field label="Name" value={user?.name} />
        <Field label="Email" value={user?.email} />
        <Field label="Role" value={user?.role} />
      </Section>
      <Section icon={MapPin} title="Station Configuration">
        <Field label="Active Station" value={selectedStation?.name} />
        <Field label="Location" value={selectedStation?.location} />
        <Field label="Status" value={selectedStation?.status} />
      </Section>
      <Section icon={Bell} title="Notifications">
        <p className="text-txt-muted text-sm">Notification configuration will be available in Phase 4.</p>
      </Section>
      <Section icon={Shield} title="Security">
        <Field label="Auth Method" value="JWT / HTTP-only cookies" />
        <Field label="Session" value="Active" />
      </Section>
    </div>
  );
}
"""
}

for rel_path, content in files.items():
    write_file(os.path.join(BASE_DIR, rel_path), content)

print("All files written successfully.")
