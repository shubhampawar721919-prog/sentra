import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldCheck, ShieldAlert, AlertTriangle, Radio,
  Zap, CloudRain, CheckCircle2, ArrowRight,
  TrendingDown, RotateCcw, Sparkles, Filter, ChevronRight,
  Sliders, Cpu, BarChart3, Clock, HelpCircle
} from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import { socket } from '../App';
import { toast } from 'react-hot-toast';

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D8E7F0',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(18,48,74,0.04)',
};

const statusConfig = {
  HEALTHY:         { label: 'HEALTHY',         color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  SUSPECTED_FAULT: { label: 'SUSPECTED FAULT', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  CONFIRMED_FAULT: { label: 'CONFIRMED FAULT', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  STALE_MISSING:   { label: 'STALE / MISSING', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  UNCERTAIN:       { label: 'UNCERTAIN',       color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' }
};

const faultClassLabels = {
  NORMAL:                      { label: 'Nominal',                   color: '#16A34A', bg: '#F0FDF4' },
  GRADUAL_DRIFT:               { label: 'Gradual Drift',             color: '#DC2626', bg: '#FEF2F2' },
  SUDDEN_SPIKE:                { label: 'Sudden Spike',              color: '#DC2626', bg: '#FEF2F2' },
  FROZEN_STUCK:                { label: 'Frozen / Stuck',            color: '#B91C1C', bg: '#FEF2F2' },
  EXCESSIVE_NOISE:             { label: 'Excessive Noise',           color: '#D97706', bg: '#FFFBEB' },
  MISSING_DROPOUT:             { label: 'Missing / Dropout',         color: '#64748B', bg: '#F1F5F9' },
  RATE_OF_CHANGE_ANOMALY:      { label: 'Rate of Change Anomaly',    color: '#D97706', bg: '#FFFBEB' },
  GENUINE_ENVIRONMENTAL_EVENT: { label: 'Genuine Environmental Event', color: '#0284C7', bg: '#F0F9FF' },
  UNCERTAIN_AMBIGUOUS:         { label: 'Uncertain Ambiguity',       color: '#7C3AED', bg: '#F5F3FF' }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedStation } = useStation();

  const [summary, setSummary] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedStation]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchDashboardData(true);
    };

    socket.on('sensor:updated', handleUpdate);
    socket.on('alert:created', handleUpdate);
    socket.on('alert:updated', handleUpdate);

    return () => {
      socket.off('sensor:updated', handleUpdate);
      socket.off('alert:created', handleUpdate);
      socket.off('alert:updated', handleUpdate);
    };
  }, [selectedStation]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const stationId = selectedStation?._id || '';
      const [sumRes, senRes] = await Promise.all([
        client.get(`/sensors/summary?stationId=${stationId}&_t=${Date.now()}`),
        client.get(`/sensors?stationId=${stationId}&_t=${Date.now()}`)
      ]);

      setSummary(sumRes.data.data);
      setSensors(senRes.data.data);
    } catch (err) {
      console.error('Sensor dashboard fetch error:', err);
      setError('Unable to load sensor intelligence summary.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSimulateScenario = async (scenario, sensorId = 'SEN-TEMP-ENV-01') => {
    setIsSimulating(true);
    try {
      const res = await client.post('/sensors/simulate-scenario', {
        scenario,
        targetSensorId: sensorId
      });
      toast.success(res.data.message || `Scenario ${scenario} simulated.`);
      await fetchDashboardData(true);
    } catch (err) {
      toast.error('Simulation error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#64748B', fontSize: '15px' }}>
        <Activity size={28} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: '#0284C7' }} />
        Synchronizing SENTRA sensor intelligence streams…
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#DC2626' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
        <h3>Sensor Intelligence Offline</h3>
        <p style={{ color: '#64748B' }}>{error || 'Cannot retrieve sensor metrics.'}</p>
      </div>
    );
  }

  // Filtered sensors
  const filteredSensors = sensors.filter(s => {
    if (filterType !== 'All' && s.type !== filterType) return false;
    if (filterStatus !== 'All' && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '40px' }}>

      {/* 1. SENTRA Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #082F49 60%, #0C4A6E 100%)',
        color: '#FFFFFF',
        borderRadius: '14px',
        padding: '24px 28px',
        boxShadow: '0 4px 18px rgba(8, 47, 73, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#082F49', padding: '4px 10px', backgroundColor: '#38BDF8', borderRadius: '4px'
              }}>
                SENTRA ENGINE ACTIVE
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.12)', color: '#BAE6FD'
              }}>
                CODE APEX · TRACK 4: TECHNOLOGY FOR SOCIAL CAUSE
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFFFFF'
              }}>
                {selectedStation?.name || 'Bharati'} Station Sensor Fleet
              </span>
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              AI Sensor Trust, Drift &amp; False-Alarm Detection Console
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, maxWidth: '780px', lineHeight: '1.5' }}>
              Continuous signal verification, spatial cross-sensor consensus, and deterministic trust scoring to distinguish true hardware faults from genuine environmental events.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/telemetry')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none',
                padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Radio size={16} /> Sensor Explorer <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/analytics')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <BarChart3 size={16} /> Evaluation Benchmarks
            </button>
          </div>
        </div>

        {/* Live Scenario Quick Injector Strip for Judges */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '10px',
          padding: '12px 16px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="#38BDF8" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#BAE6FD', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Demo Scenario Injector:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario('GRADUAL_DRIFT')}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #F87171',
                backgroundColor: '#7F1D1D', color: '#FECACA', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
              title="Inject subtle +8.5°C drift into SEN-TEMP-ENV-01 while peer sensors stay nominal"
            >
              Simulate Sensor Drift (Fault)
            </button>

            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario('GENUINE_ENVIRONMENTAL_EVENT')}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #38BDF8',
                backgroundColor: '#075985', color: '#E0F2FE', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
              title="Simulate -14°C sudden blizzard dropping all mast sensors in consensus (Zero False Alarm)"
            >
              Trigger Cold Front (Genuine Event)
            </button>

            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario('SUDDEN_SPIKE')}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #FBBF24',
                backgroundColor: '#78350F', color: '#FEF3C7', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Inject Transient Spike
            </button>

            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario('FROZEN_STUCK')}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #C084FC',
                backgroundColor: '#581C87', color: '#F3E8FF', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Freeze Value (Stuck-At)
            </button>

            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario('RESET_NOMINAL')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #4ADE80',
                backgroundColor: '#14532D', color: '#DCFCE7', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} /> Reset Nominal
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Card Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        
        {/* Total Monitored Sensors */}
        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Monitored Sensors
            </span>
            <Radio size={16} color="#0284C7" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#1E3448', lineHeight: 1 }}>
            {summary.totalSensors}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            Across {selectedStation?.name || 'Station'} assets
          </div>
        </div>

        {/* Healthy Sensors */}
        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>
              Healthy Channels
            </span>
            <ShieldCheck size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>
            {summary.healthySensors}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            {summary.totalSensors > 0 ? Math.round((summary.healthySensors / summary.totalSensors) * 100) : 100}% Fleet Health
          </div>
        </div>

        {/* Suspected Faults */}
        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: summary.suspectedFaults > 0 ? '#D97706' : '#64748B', textTransform: 'uppercase' }}>
              Suspected Faults
            </span>
            <ShieldAlert size={16} color={summary.suspectedFaults > 0 ? '#D97706' : '#94A3B8'} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: summary.suspectedFaults > 0 ? '#D97706' : '#1E3448', lineHeight: 1 }}>
            {summary.suspectedFaults}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            Drift / Spikes / Jitter
          </div>
        </div>

        {/* Confirmed / Stale */}
        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: summary.confirmedFaults > 0 ? '#DC2626' : '#64748B', textTransform: 'uppercase' }}>
              Confirmed / Stale
            </span>
            <AlertTriangle size={16} color={summary.confirmedFaults > 0 ? '#DC2626' : '#94A3B8'} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: summary.confirmedFaults > 0 ? '#DC2626' : '#1E3448', lineHeight: 1 }}>
            {summary.confirmedFaults + summary.missingOrStale}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            {summary.missingOrStale} stale or missing
          </div>
        </div>

        {/* Average Trust Score */}
        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
              Fleet Trust Score
            </span>
            <Sparkles size={16} color="#0284C7" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: summary.avgTrustScore < 80 ? '#D97706' : '#0284C7', lineHeight: 1 }}>
            {summary.avgTrustScore}
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#94A3B8', marginLeft: '3px' }}>/100</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            Multi-factor weighted trust
          </div>
        </div>

        {/* False-Alarm Reduction */}
        <div style={{ ...cardStyle, padding: '18px 20px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
              False Alarm Reduction
            </span>
            <CheckCircle2 size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>
            -{summary.falseAlarmReductionPercent}%
          </div>
          <div style={{ fontSize: '12px', color: '#166534', marginTop: '6px', fontWeight: 600 }}>
            vs. Naive Threshold Rules
          </div>
        </div>

      </div>

      {/* 3. Main Operational Workspace: Sensor Health Matrix & Anomaly Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left: Sensor Fleet Health Matrix */}
        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1E3448', margin: 0 }}>
                Monitored Sensor Fleet
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                Real-time readings, calibrated trust scores, and contextual assessments
              </p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: '6px', border: '1px solid #D8E7F0',
                  fontSize: '12px', fontWeight: 600, color: '#1E3448', backgroundColor: '#F8FAFC'
                }}
              >
                <option value="All">All Types</option>
                <option value="TEMPERATURE">Temperature</option>
                <option value="VIBRATION">Vibration</option>
                <option value="POWER">Power</option>
                <option value="PRESSURE">Pressure</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: '6px', border: '1px solid #D8E7F0',
                  fontSize: '12px', fontWeight: 600, color: '#1E3448', backgroundColor: '#F8FAFC'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="HEALTHY">Healthy</option>
                <option value="SUSPECTED_FAULT">Suspected Fault</option>
                <option value="CONFIRMED_FAULT">Confirmed Fault</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px' }}>Sensor Channel</th>
                  <th style={{ padding: '8px 10px' }}>Current Value</th>
                  <th style={{ padding: '8px 10px' }}>Trust Score</th>
                  <th style={{ padding: '8px 10px' }}>Assessment</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSensors.map(sensor => {
                  const sc = statusConfig[sensor.status] || statusConfig.HEALTHY;
                  const fc = faultClassLabels[sensor.faultClass] || faultClassLabels.NORMAL;

                  return (
                    <tr
                      key={sensor._id}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.1s ease' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#1E3448' }}>{sensor.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          <code>{sensor.sensorId}</code> · {sensor.location}
                        </div>
                      </td>

                      <td style={{ padding: '10px', fontWeight: 700, color: '#1E3448' }}>
                        {sensor.currentReading !== null ? `${sensor.currentReading} ${sensor.unit}` : 'NaN (Missing)'}
                      </td>

                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '50px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${sensor.trustScore || 0}%`,
                              height: '100%',
                              backgroundColor: sensor.trustScore >= 85 ? '#16A34A' : sensor.trustScore >= 60 ? '#D97706' : '#DC2626'
                            }} />
                          </div>
                          <span style={{
                            fontWeight: 800, fontSize: '12px',
                            color: sensor.trustScore >= 85 ? '#16A34A' : sensor.trustScore >= 60 ? '#D97706' : '#DC2626'
                          }}>
                            {sensor.trustScore}%
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '10px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                          color: fc.color, backgroundColor: fc.bg
                        }}>
                          {fc.label}
                        </span>
                      </td>

                      <td style={{ padding: '10px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                          color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.border}`
                        }}>
                          {sc.label}
                        </span>
                      </td>

                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/telemetry?sensorId=${sensor.sensorId}`)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '6px', border: '1px solid #D8E7F0',
                            backgroundColor: '#FFFFFF', color: '#0284C7', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Inspect <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Anomaly & Genuine Event Activity Log */}
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#0284C7" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E3448', margin: 0 }}>
                Anomaly &amp; Event Stream
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
              {summary.anomaliesTimeline?.length || 0} Events
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px' }}>
            {(!summary.anomaliesTimeline || summary.anomaliesTimeline.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748B' }}>
                <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 8px', display: 'block' }} />
                No sensor anomalies or active faults recorded.
              </div>
            ) : summary.anomaliesTimeline.map((item, idx) => {
              const fc = faultClassLabels[item.faultClass] || faultClassLabels.NORMAL;
              const isGen = item.faultClass === 'GENUINE_ENVIRONMENTAL_EVENT';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px', borderRadius: '8px',
                    border: `1px solid ${isGen ? '#BAE6FD' : '#FECACA'}`,
                    backgroundColor: isGen ? '#F0F9FF' : '#FEF2F2'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                      backgroundColor: fc.bg, color: fc.color
                    }}>
                      {fc.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3448' }}>
                    {item.sensorName} ({item.sensorId})
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Reading: <strong>{item.value} {item.unit}</strong> · Trust: {item.trustScore}%
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Explainable Decision Support
            </span>
            <button
              onClick={() => navigate('/alerts')}
              style={{
                fontSize: '12px', fontWeight: 700, color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer'
              }}
            >
              View All Alerts →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
