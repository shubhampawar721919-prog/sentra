import { useState, useEffect } from 'react';
import { Bell, MapPin, ChevronDown, Zap, Activity, Radio, WifiOff } from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { socket } from '../App';
import AnomalyTriggerModal from './AnomalyTriggerModal';
import SatcomEdgeModal from './SatcomEdgeModal';
import { toast } from 'react-hot-toast';

const pageTitles = {
  '/dashboard':       'Sensor Intelligence Overview',
  '/decision-center': 'Operational Decision Center',
  '/digital-twin':    'Connected Digital Twin',
  '/assets':          'Monitored Infrastructure Assets',
  '/telemetry':       'Sensor Explorer & Timeseries',
  '/alerts':          'Explainable Sensor Alerts',
  '/analytics':       'Model Evaluation Workspace',
  '/settings':        'Settings & Diagnostics',
};

const navbarStyle = {
  height: '72px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 32px',
  backgroundColor: '#FFFFFF',
  borderBottom: '1px solid #D8E7F0',
  zIndex: 20,
};

const stationSelectorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  backgroundColor: '#F6FAFD',
  border: '1px solid #D8E7F0',
  borderRadius: '10px',
  cursor: 'pointer',
};

const liveIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  backgroundColor: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: '10px',
};

export default function Navbar() {
  const { stations, selectedStation, setSelectedStation } = useStation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [isSatcomModalOpen, setIsSatcomModalOpen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [bufferedCount, setBufferedCount] = useState(0);

  // Increment buffered telemetry frames when in polar storm blackout
  useEffect(() => {
    let timer;
    if (isBlackout) {
      timer = setInterval(() => {
        setBufferedCount(prev => prev + 1);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isBlackout]);

  const handleToggleBlackout = () => {
    if (!isBlackout) {
      setIsBlackout(true);
      toast.error('⚠️ Polar Storm SATCOM Blackout Active: Ku-band link lost. Station transitioned to local Store-and-Forward Edge Mode.', {
        duration: 5000,
        style: { border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#991B1B', fontWeight: 700 }
      });
    } else {
      setIsBlackout(false);
      const count = bufferedCount;
      setBufferedCount(0);
      toast.success(`✓ SATCOM Link Restored: Flushed ${count} buffered telemetry frames to NCPOR Goa Central Terminal.`, {
        duration: 5000,
        style: { border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', color: '#166534', fontWeight: 700 }
      });
    }
  };

  const title = pageTitles[location.pathname] || 'SENTRA';

  useEffect(() => {
    if (!selectedStation) return;

    const fetchAlertCount = async () => {
      try {
        const res = await client.get(`/alerts?stationId=${selectedStation._id}&status=ACTIVE&_t=${Date.now()}`);
        setActiveAlertCount(res.data.data.length);
      } catch (err) {
        console.error("Failed to fetch alerts for navbar", err);
      }
    };

    fetchAlertCount();

    const handleAlertChange = () => fetchAlertCount();

    socket.on('alert:created', handleAlertChange);
    socket.on('alert:updated', handleAlertChange);

    return () => {
      socket.off('alert:created', handleAlertChange);
      socket.off('alert:updated', handleAlertChange);
    };
  }, [selectedStation]);

  return (
    <header style={{
      ...navbarStyle,
      ...(activeAlertCount > 0 ? { borderBottom: '2px solid #DC2626', backgroundColor: '#FEF2F2' } : {})
    }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#12304A', margin: 0 }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Station selector */}
        <div style={stationSelectorStyle}>
          <MapPin style={{ width: '16px', height: '16px', color: '#2563EB', flexShrink: 0 }} />
          <select
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '15px',
              fontWeight: 600,
              color: '#1E3448',
              outline: 'none',
              cursor: 'pointer',
              paddingRight: '6px',
              fontFamily: 'Inter, sans-serif',
            }}
            value={selectedStation?._id || ''}
            onChange={e => {
              const s = stations.find(st => st._id === e.target.value);
              if (s) setSelectedStation(s);
            }}
          >
            {stations.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown style={{ width: '16px', height: '16px', color: '#64748B', flexShrink: 0 }} />
        </div>

        {/* LIVE / CRITICAL indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px',
          ...(activeAlertCount > 0 
            ? { backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }
            : { backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' })
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: activeAlertCount > 0 ? '#DC2626' : '#16A34A',
            animation: 'pulse-dot 2s ease-in-out infinite',
            boxShadow: `0 0 0 3px ${activeAlertCount > 0 ? '#DC262633' : '#16A34A33'}`,
          }} />
          <span style={{ 
            fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em',
            color: activeAlertCount > 0 ? '#DC2626' : '#16A34A'
          }}>
            {activeAlertCount > 0 ? 'CRITICAL STATE' : 'LIVE'}
          </span>
        </div>

        {/* Polar SATCOM Link & Edge Mode Button */}
        <button
          onClick={() => setIsSatcomModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px',
            backgroundColor: isBlackout ? '#FFFBEB' : '#F0F9FF',
            border: `1px solid ${isBlackout ? '#FDE68A' : '#BAE6FD'}`,
            color: isBlackout ? '#B45309' : '#0369A1',
            cursor: 'pointer', fontSize: '13px', fontWeight: 700,
            transition: 'all 0.2s ease'
          }}
          title="Inspect Polar Satellite Uplink & Local Edge Server Status"
        >
          {isBlackout ? <WifiOff size={15} color="#DC2626" /> : <Radio size={15} color="#0284C7" />}
          <span>
            {isBlackout ? `EDGE MODE (${bufferedCount} queued)` : 'SATCOM 640ms'}
          </span>
        </button>

        {/* Live Fault / Anomaly Simulator Button */}
        <button
          onClick={() => setIsAnomalyModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
            color: '#B45309', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
          title="Open Fault Injection & Anomaly Testing Console"
        >
          <Zap style={{ width: '16px', height: '16px', color: '#D97706' }} />
          <span>Fault Simulator</span>
        </button>

        {/* Live Ping-Pong Latency Monitor Button */}
        <button
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px', borderRadius: '10px',
            backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
            color: '#166534', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease'
          }}
          title="Open Ping-Pong Heartbeat & Latency Monitor in Settings"
        >
          <Activity style={{ width: '15px', height: '15px', color: '#16A34A' }} />
          <span>Ping Pong</span>
        </button>

        {/* Bell */}
        <button
          onClick={() => navigate('/alerts')}
          style={{
            position: 'relative',
            padding: '10px',
            backgroundColor: '#F6FAFD',
            border: '1px solid #D8E7F0',
            borderRadius: '10px',
            cursor: 'pointer',
            color: '#64748B',
          }}
        >
          <Bell style={{ width: '20px', height: '20px' }} />
          {activeAlertCount > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              minWidth: '20px', height: '20px', padding: '0 6px',
              backgroundColor: '#DC2626',
              borderRadius: '10px',
              border: '2px solid #FFFFFF',
              color: '#FFFFFF', fontSize: '11px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeAlertCount}
            </span>
          )}
        </button>
      </div>

      <AnomalyTriggerModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        activeStation={selectedStation}
      />

      <SatcomEdgeModal
        isOpen={isSatcomModalOpen}
        onClose={() => setIsSatcomModalOpen(false)}
        isBlackout={isBlackout}
        onToggleBlackout={handleToggleBlackout}
        bufferedCount={bufferedCount}
      />
    </header>
  );
}
