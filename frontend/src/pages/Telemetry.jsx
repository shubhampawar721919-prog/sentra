import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Radio, Activity, ShieldCheck, ShieldAlert, AlertTriangle,
  RotateCcw, Sparkles, Sliders, CheckCircle2, ChevronRight,
  Search, Filter, Layers, HelpCircle, ArrowUpRight, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Line
} from 'recharts';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
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

const faultClassConfig = {
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

export default function Telemetry() {
  const { selectedStation } = useStation();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySensorId = searchParams.get('sensorId');

  const [sensors, setSensors] = useState([]);
  const [selectedSensorId, setSelectedSensorId] = useState('');
  const [selectedSensorData, setSelectedSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadSensors();
  }, [selectedStation]);

  useEffect(() => {
    if (selectedSensorId) {
      loadSensorDetail(selectedSensorId);
    }
  }, [selectedSensorId]);

  useEffect(() => {
    const handleUpdate = (updatedSensor) => {
      if (updatedSensor.sensorId === selectedSensorId) {
        loadSensorDetail(selectedSensorId, true);
      }
      setSensors(prev => prev.map(s => s.sensorId === updatedSensor.sensorId ? updatedSensor : s));
    };

    socket.on('sensor:updated', handleUpdate);
    return () => {
      socket.off('sensor:updated', handleUpdate);
    };
  }, [selectedSensorId]);

  const loadSensors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get(`/sensors?stationId=${selectedStation?._id || ''}&_t=${Date.now()}`);
      const list = res.data.data || [];
      setSensors(list);

      // Determine initial selection
      if (list.length > 0) {
        const initial = querySensorId && list.some(s => s.sensorId === querySensorId)
          ? querySensorId
          : list[0].sensorId;
        setSelectedSensorId(initial);
      }
    } catch (err) {
      console.error('Failed to load sensors:', err);
      setError('Unable to load sensors list.');
    } finally {
      setLoading(false);
    }
  };

  const loadSensorDetail = async (sensorId, silent = false) => {
    if (!silent) setDetailLoading(true);
    try {
      const res = await client.get(`/sensors/${sensorId}?_t=${Date.now()}`);
      setSelectedSensorData(res.data.data);
    } catch (err) {
      console.error('Failed to load sensor detail:', err);
    } finally {
      if (!silent) setDetailLoading(false);
    }
  };

  const handleSimulateScenario = async (scenario) => {
    if (!selectedSensorId) return;
    setIsSimulating(true);
    try {
      const res = await client.post('/sensors/simulate-scenario', {
        scenario,
        targetSensorId: selectedSensorId
      });
      toast.success(res.data.message || `Scenario ${scenario} executed.`);
      await loadSensorDetail(selectedSensorId, true);
      const listRes = await client.get(`/sensors?stationId=${selectedStation?._id || ''}&_t=${Date.now()}`);
      setSensors(listRes.data.data || []);
    } catch (err) {
      toast.error('Simulation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  // Filtered sensor list
  const filteredSensors = sensors.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.sensorId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'All' || s.type === typeFilter;
    return matchSearch && matchType;
  });

  const sensor = selectedSensorData?.sensor;
  const relatedPeers = selectedSensorData?.relatedSensorsDetails || [];

  // Prepare timeseries chart data
  const chartData = (sensor?.recentReadings || []).map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: r.value,
    isAnomaly: r.isAnomaly,
    faultClass: r.faultClass,
    trustScore: r.trustScore
  }));

  const currentStatus = statusConfig[sensor?.status] || statusConfig.HEALTHY;
  const currentFault = faultClassConfig[sensor?.faultClass] || faultClassConfig.NORMAL;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>

      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              SENTRA SENSOR EXPLORER
            </span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              · {sensors.length} Active Channels
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#12304A', margin: 0 }}>
            Sensor Timeseries &amp; Health Inspector
          </h1>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => loadSensors()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: '1px solid #D8E7F0',
              backgroundColor: '#FFFFFF', color: '#1E3448', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} /> Refresh Channels
          </button>
        </div>
      </div>

      {/* 2. Main Split: Left Sensor List / Right Deep Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT COLUMN: Sensor List & Filter */}
        <div style={{ ...cardStyle, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Search Box */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '8px', border: '1px solid #D8E7F0', backgroundColor: '#F8FAFC'
          }}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search sensor ID or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                width: '100%', fontSize: '13px', color: '#1E3448'
              }}
            />
          </div>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['All', 'TEMPERATURE', 'VIBRATION', 'POWER', 'PRESSURE'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '4px 10px', borderRadius: '6px', border: 'none',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  backgroundColor: typeFilter === t ? '#0284C7' : '#F1F5F9',
                  color: typeFilter === t ? '#FFFFFF' : '#64748B'
                }}
              >
                {t === 'All' ? 'All' : t.slice(0, 4)}
              </button>
            ))}
          </div>

          {/* Sensor Channel Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '680px', overflowY: 'auto' }}>
            {filteredSensors.map(s => {
              const isSelected = s.sensorId === selectedSensorId;
              const sc = statusConfig[s.status] || statusConfig.HEALTHY;
              const fc = faultClassConfig[s.faultClass] || faultClassConfig.NORMAL;

              return (
                <div
                  key={s._id}
                  onClick={() => {
                    setSelectedSensorId(s.sensorId);
                    setSearchParams({ sensorId: s.sensorId });
                  }}
                  style={{
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    border: isSelected ? '2px solid #0284C7' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E3448' }}>
                      {s.sensorId}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                      backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`
                    }}>
                      {sc.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ fontWeight: 700, color: '#0284C7' }}>
                      {s.currentReading !== null ? `${s.currentReading} ${s.unit}` : 'Missing'}
                    </span>
                    <span style={{
                      fontWeight: 800,
                      color: s.trustScore >= 85 ? '#16A34A' : s.trustScore >= 60 ? '#D97706' : '#DC2626'
                    }}>
                      Trust: {s.trustScore}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: Selected Sensor Deep Inspector */}
        {detailLoading && !sensor ? (
          <div style={{ ...cardStyle, padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <Activity size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block', color: '#0284C7' }} />
            Loading channel intelligence…
          </div>
        ) : !sensor ? (
          <div style={{ ...cardStyle, padding: '60px', textAlign: 'center', color: '#64748B' }}>
            Select a sensor channel to inspect its parameters and telemetry trajectory.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Sensor Overview Hero Card */}
            <div style={{ ...cardStyle, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                      backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD'
                    }}>
                      {sensor.type} SENSOR
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                      backgroundColor: currentStatus.bg, color: currentStatus.color, border: `1px solid ${currentStatus.border}`
                    }}>
                      {currentStatus.label}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                      backgroundColor: currentFault.bg, color: currentFault.color
                    }}>
                      CLASSIFIED: {currentFault.label}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#12304A', margin: '0 0 4px' }}>
                    {sensor.name}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                    <code>{sensor.sensorId}</code> · Location: {sensor.location} · Asset: <strong>{sensor.assetCode || 'Critical Subsystem'}</strong>
                  </p>
                </div>

                {/* Big Live Value & Trust Gauge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  
                  {/* Reading */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Current Value</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#1E3448', lineHeight: 1 }}>
                      {sensor.currentReading !== null ? `${sensor.currentReading}` : 'NaN'}
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#64748B', marginLeft: '4px' }}>{sensor.unit}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Nominal: {sensor.nominalRange?.min ?? 0} to {sensor.nominalRange?.max ?? 100} {sensor.unit}
                    </div>
                  </div>

                  {/* Trust Gauge Badge */}
                  <div style={{
                    padding: '12px 18px', borderRadius: '10px',
                    backgroundColor: sensor.trustScore >= 85 ? '#F0FDF4' : sensor.trustScore >= 60 ? '#FFFBEB' : '#FEF2F2',
                    border: `1px solid ${sensor.trustScore >= 85 ? '#BBF7D0' : sensor.trustScore >= 60 ? '#FDE68A' : '#FECACA'}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Sensor Trust</div>
                    <div style={{
                      fontSize: '28px', fontWeight: 800, lineHeight: 1,
                      color: sensor.trustScore >= 85 ? '#16A34A' : sensor.trustScore >= 60 ? '#D97706' : '#DC2626'
                    }}>
                      {sensor.trustScore}%
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', marginTop: '2px' }}>
                      Confidence: {Math.round((sensor.modelConfidence || 0.9) * 100)}%
                    </div>
                  </div>

                </div>
              </div>

              {/* Assessment Explanation Box */}
              <div style={{
                marginTop: '16px', padding: '12px 16px', borderRadius: '8px',
                backgroundColor: sensor.isGenuineEvent ? '#F0F9FF' : (sensor.trustScore < 85 ? '#FFFBEB' : '#F8FAFC'),
                border: `1px solid ${sensor.isGenuineEvent ? '#BAE6FD' : (sensor.trustScore < 85 ? '#FDE68A' : '#E2E8F0')}`
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E3448', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Model Assessment &amp; Context Reasoning:
                </div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>
                  {sensor.explanation}
                </div>
              </div>
            </div>

            {/* Timeseries Chart Card */}
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                    Signal Trajectory &amp; Anomaly Detection Window
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                    Streaming 60-step temporal window with anomaly flags and threshold boundaries
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#0284C7', borderRadius: '2px' }} />
                    <span>Raw Reading ({sensor.unit})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '10px', height: '2px', backgroundColor: '#DC2626' }} />
                    <span>Threshold Limits</span>
                  </div>
                </div>
              </div>

              {/* Recharts Area Chart */}
              <div style={{ height: '320px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    
                    {sensor.nominalRange?.max !== undefined && (
                      <ReferenceLine y={sensor.nominalRange.max} stroke="#DC2626" strokeDasharray="3 3" />
                    )}
                    {sensor.nominalRange?.min !== undefined && (
                      <ReferenceLine y={sensor.nominalRange.min} stroke="#DC2626" strokeDasharray="3 3" />
                    )}

                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: '#FFFFFF', border: '1px solid #D8E7F0',
                              borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                            }}>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{label}</div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7' }}>
                                {pt.value} {sensor.unit}
                              </div>
                              <div style={{ fontSize: '11px', color: '#1E3448', marginTop: '4px' }}>
                                Class: <strong>{pt.faultClass}</strong> · Trust: <strong>{pt.trustScore}%</strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0284C7"
                      strokeWidth={2.5}
                      fill="url(#sensorGrad)"
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (payload.isAnomaly) {
                          return (
                            <circle
                              key={`dot-${cx}-${cy}`}
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#DC2626"
                              stroke="#FFFFFF"
                              strokeWidth={2}
                            />
                          );
                        }
                        return null;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Deep Diagnostic Evidence & Peer Correlation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              
              {/* Evidence Audit Card */}
              <div style={{ ...cardStyle, padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3448', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Explainability Evidence Breakdown
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(!sensor.evidence || sensor.evidence.length === 0) ? (
                    <div style={{ fontSize: '13px', color: '#64748B' }}>No abnormal evidence recorded.</div>
                  ) : sensor.evidence.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px', borderRadius: '8px',
                        backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7' }}>{ev.factor}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3448' }}>{ev.value}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{ev.impact}</div>
                      </div>
                      {ev.scoreDelta !== undefined && ev.scoreDelta !== 0 && (
                        <span style={{
                          fontSize: '12px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                          backgroundColor: '#FEF2F2', color: '#DC2626'
                        }}>
                          {ev.scoreDelta > 0 ? `+${ev.scoreDelta}` : ev.scoreDelta} pts
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Peer Sensors & Agreement */}
              <div style={{ ...cardStyle, padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3448', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Related Peer Channels Considered
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatedPeers.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      No peer channels mapped in this sector.
                    </div>
                  ) : relatedPeers.map(peer => (
                    <div
                      key={peer.sensorId}
                      style={{
                        padding: '10px 14px', borderRadius: '8px',
                        backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E3448' }}>{peer.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}><code>{peer.sensorId}</code> · {peer.type}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284C7' }}>
                          {peer.currentReading} {peer.unit}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: peer.trustScore >= 85 ? '#16A34A' : '#D97706' }}>
                          Trust: {peer.trustScore}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 4. Live Interactive Scenario Testing Console on THIS Sensor */}
            <div style={{
              ...cardStyle, padding: '20px',
              backgroundColor: '#F8FAFC', border: '1px solid #BAE6FD'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0369A1', margin: 0 }}>
                    Sensor Scenario Demonstration Console
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                    Inject reproducible test faults or genuine environmental events into <code>{sensor.sensorId}</code>
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369A1', backgroundColor: '#E0F2FE', padding: '4px 8px', borderRadius: '4px' }}>
                  DETERMINISTIC EVALUATION
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateScenario('GRADUAL_DRIFT')}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid #FECACA',
                    backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>1. Inject Gradual Drift</div>
                  <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 400 }}>Slow unphysical drift while peers remain steady</div>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateScenario('GENUINE_ENVIRONMENTAL_EVENT')}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid #BAE6FD',
                    backgroundColor: '#F0F9FF', color: '#0369A1', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>2. Genuine Cold Front</div>
                  <div style={{ fontSize: '11px', color: '#075985', fontWeight: 400 }}>Ambient drop with 100% peer consensus</div>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateScenario('SUDDEN_SPIKE')}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A',
                    backgroundColor: '#FFFBEB', color: '#B45309', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>3. Transient Spike</div>
                  <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 400 }}>Single-sample electrical noise impulse</div>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateScenario('FROZEN_STUCK')}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid #DDD6FE',
                    backgroundColor: '#F5F3FF', color: '#6D28D9', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>4. Stuck Transducer</div>
                  <div style={{ fontSize: '11px', color: '#5B21B6', fontWeight: 400 }}>Zero variance stuck-at reading</div>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateScenario('EXCESSIVE_NOISE')}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF', color: '#1E3448', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>5. Excessive Jitter</div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>High-frequency variance surge</div>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateScenario('MISSING_DROPOUT')}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>6. Signal Dropout</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>Missing telemetry frames / nulls</div>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateScenario('RESET_NOMINAL')}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', border: '1px solid #BBF7D0',
                    backgroundColor: '#F0FDF4', color: '#15803D', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800 }}>Reset Nominal</div>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 400 }}>Restore nominal baseline &amp; clear faults</div>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
