import { useState, useEffect } from 'react';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D8E7F0',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(18,48,74,0.04)',
  padding: '24px',
};

export default function Analytics() {
  const { selectedStation } = useStation();
  const [timeframe, setTimeframe] = useState('24h');
  const [trendData, setTrendData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedStation) fetchAnalytics();
  }, [selectedStation, timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsRes, alertsRes] = await Promise.all([
        client.get(`/stations/${selectedStation._id}/trends?timeframe=${timeframe}&_t=${Date.now()}`),
        client.get(`/alerts?stationId=${selectedStation._id}&_t=${Date.now()}`)
      ]);
      setTrendData(trendsRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError('Unable to load historical telemetry trends.');
    } finally {
      setLoading(false);
    }
  };

  const timeline = trendData?.timeline || [];
  const highlights = trendData?.highlights || [];
  const degradation = trendData?.degradation || {
    status: 'NOMINAL',
    vibrationTrend: 'Stable (→)',
    temperatureTrend: 'Stable (→)',
    efficiencyTrend: 'Stable (→)',
    summary: 'Operating within baseline statistical boundaries.'
  };

  const severityDistribution = [
    { name: 'CRITICAL', count: alerts.filter(a => a.severity === 'CRITICAL').length, fill: '#DC2626' },
    { name: 'HIGH', count: alerts.filter(a => a.severity === 'HIGH').length, fill: '#D97706' },
    { name: 'MEDIUM', count: alerts.filter(a => a.severity === 'MEDIUM').length, fill: '#F59E0B' },
    { name: 'LOW', count: alerts.filter(a => a.severity === 'LOW').length, fill: '#2563EB' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header with Timeframe Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#12304A', margin: '0 0 6px' }}>
            Operations & Degradation Analytics
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
            Empirical historical telemetry trends, mathematical degradation trajectories, and load curves.
          </p>
        </div>

        {/* 6H / 12H / 24H Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
          {['6h', '12h', '24h'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '8px 18px', borderRadius: '8px', border: 'none',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                backgroundColor: timeframe === tf ? '#2563EB' : 'transparent',
                color: timeframe === tf ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease',
                textTransform: 'uppercase'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#64748B', fontSize: '15px' }}>
          Aggregating historical telemetry across {timeframe} window…
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626', fontSize: '15px' }}>
          {error}
        </div>
      ) : (
        <>
          {/* Calculated Empirical Highlights (Part 16) */}
          {highlights.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {highlights.map((h, i) => (
                <div key={i} style={{
                  ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
                  backgroundColor: h.type === 'warning' ? '#FFFBEB' : '#F8FAFC',
                  border: `1px solid ${h.type === 'warning' ? '#FDE68A' : '#E2E8F0'}`
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    backgroundColor: h.type === 'warning' ? '#FEF3C7' : '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {h.type === 'warning' ? <AlertTriangle size={20} color="#D97706" /> : <TrendingUp size={20} color="#2563EB" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      {h.metric} ({h.change})
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E3448', marginTop: '2px' }}>
                      {h.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Degradation Trend Analysis Card (Part 17) */}
          <div style={{ ...cardStyle, borderLeft: '4px solid #2563EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  STATISTICAL DEGRADATION ANALYSIS
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E3448', margin: '4px 0 0' }}>
                  DG-001 · Primary Diesel Generator Trajectory
                </h3>
              </div>
              <span style={{
                fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '6px',
                backgroundColor: degradation.status === 'DEGRADING' ? '#FFFBEB' : degradation.status === 'RAPID DEGRADATION' ? '#FEF2F2' : '#F0FDF4',
                color: degradation.status === 'DEGRADING' ? '#D97706' : degradation.status === 'RAPID DEGRADATION' ? '#DC2626' : '#16A34A',
                border: `1px solid ${degradation.status === 'DEGRADING' ? '#FDE68A' : degradation.status === 'RAPID DEGRADATION' ? '#FECACA' : '#BBF7D0'}`
              }}>
                STATUS: {degradation.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Vibration Trend</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3448', marginTop: '4px' }}>
                  {degradation.vibrationTrend}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Slope: {degradation.vibSlopePercent > 0 ? `+${degradation.vibSlopePercent}%` : `${degradation.vibSlopePercent}%`}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Thermal Trend</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3448', marginTop: '4px' }}>
                  {degradation.temperatureTrend}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Slope: {degradation.tempSlopePercent > 0 ? `+${degradation.tempSlopePercent}%` : `${degradation.tempSlopePercent}%`}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Power Efficiency</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3448', marginTop: '4px' }}>
                  {degradation.efficiencyTrend}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Output/Load ratio
                </div>
              </div>

              <div style={{ backgroundColor: '#EFF6FF', padding: '14px 18px', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>Statistical Model</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E3448', marginTop: '4px', lineHeight: '1.4' }}>
                  {degradation.summary}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Note: Transparent moving-average slope analysis calculated directly from historical telemetry points.
            </div>
          </div>

          {/* Historical Trends Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

            {/* Chart 1: Power vs Demand vs Margin */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                  Generation vs Station Demand & Energy Margin (kW)
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{timeframe.toUpperCase()} Timeline</span>
              </div>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={timeline} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={-10} domain={['dataMin - 20', 'dataMax + 20']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" name="Generation (kW)" dataKey="power" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Estimated Demand (kW)" dataKey="demand" stroke="#D97706" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" name="Margin (kW)" dataKey="margin" stroke="#16A34A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Alert Risk Distribution */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E3448', margin: '0 0 18px' }}>
                Active Risk Distribution
              </h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={severityDistribution} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Additional Trends: Vibration/Temperature & Fuel Level */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Chart 3: Generator Vibration & Core Temperature */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                  DG-001 Vibration (mm/s) & Temperature (°C)
                </h3>
              </div>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={timeline} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#0EA5E9' }} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#DC2626' }} dx={10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" name="Vibration (mm/s)" dataKey="vibration" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" name="Core Temp (°C)" dataKey="temperature" stroke="#DC2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Fuel Level Depletion & External Weather Temp */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                  Fuel Level (%) & Polar Weather (°C)
                </h3>
              </div>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={timeline} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#16A34A' }} dx={-10} domain={[60, 100]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6366F1' }} dx={10} domain={[-45, -10]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" name="Fuel Level (%)" dataKey="fuelLevel" stroke="#16A34A" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" name="External Temp (°C)" dataKey="externalTemp" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
