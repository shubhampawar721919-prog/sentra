import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Compass, Cpu, Database, Activity,
  ShieldAlert, BarChart3, Settings2, LogOut,
  Snowflake, User2, Radio
} from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Sensor Intelligence', path: '/dashboard',       icon: Activity },
  { name: 'Sensor Explorer',     path: '/telemetry',       icon: Radio },
  { name: 'Model Evaluation',    path: '/analytics',       icon: BarChart3 },
  { name: 'Digital Twin',        path: '/digital-twin',    icon: Cpu },
  { name: 'Decision Center',     path: '/decision-center', icon: Compass },
  { name: 'Alerts',              path: '/alerts',          icon: ShieldAlert },
  { name: 'Assets',              path: '/assets',          icon: Database },
  { name: 'Settings',            path: '/settings',        icon: Settings2 },
];

const sidebarStyle = {
  width: '260px',
  flexShrink: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#FFFFFF',
  borderRight: '1px solid #D8E7F0',
  overflowY: 'auto',
};

const logoSectionStyle = {
  height: '72px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 20px',
  borderBottom: '1px solid #D8E7F0',
  flexShrink: 0,
};

const logoIconStyle = {
  width: '38px',
  height: '38px',
  background: 'linear-gradient(135deg, #0284C7 0%, #0891B2 100%)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px',
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(6, 182, 212, 0.25)'
};

const navSectionStyle = {
  flex: 1,
  padding: '16px 14px',
  overflowY: 'auto',
};

const bottomSectionStyle = {
  borderTop: '1px solid #D8E7F0',
  padding: '16px 14px',
  flexShrink: 0,
};

const stationStatusStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '10px',
  backgroundColor: '#E8F5FC',
  marginBottom: '12px',
};

const userRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 14px',
  borderRadius: '10px',
};

const userAvatarStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: '#D9EFFB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export default function Sidebar() {
  const { selectedStation } = useStation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={sidebarStyle}>
      {/* Logo */}
      <div style={logoSectionStyle}>
        <div style={logoIconStyle}>
          <Activity style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#12304A', letterSpacing: '0.08em' }}>SENTRA</div>
          <div style={{ fontSize: '10px', color: '#0284C7', letterSpacing: '0.04em', fontWeight: 700, textTransform: 'uppercase', marginTop: '1px' }}>
            Sensor Intelligence
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={navSectionStyle}>
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 12px' }}>
            Navigation
          </span>
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                marginBottom: '4px',
                transition: 'all 0.15s ease',
                color: isActive ? '#2563EB' : '#64748B',
                backgroundColor: isActive ? '#EFF6FF' : 'transparent',
              })}
              className={({ isActive }) => isActive ? 'nav-active' : 'nav-item'}
            >
              <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={bottomSectionStyle}>
        {/* System Status */}
        <div style={{ padding: '0 12px', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            System Status
          </span>
        </div>
        <div style={stationStatusStyle}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: selectedStation?.status === 'OPERATIONAL' ? '#16A34A' : '#F59E0B',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '14px', color: '#1E3448', fontWeight: 600 }}>
            {selectedStation?.name || 'No Station'} Online
          </span>
        </div>

        {/* User */}
        <div style={userRowStyle}>
          <div style={userAvatarStyle}>
            <User2 style={{ width: '20px', height: '20px', color: '#2563EB' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E3448', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
              {user?.name || 'Operator'}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role || 'USER'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              padding: '6px', background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B', borderRadius: '6px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          >
            <LogOut style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
