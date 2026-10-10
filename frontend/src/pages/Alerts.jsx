import { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter } from 'lucide-react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import { socket } from '../App';
import AlertDetailDrawer from '../components/AlertDetailDrawer';

const sevStyle = {
  CRITICAL: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', leftColor: '#DC2626' },
  HIGH:     { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', leftColor: '#DC2626' },
  MEDIUM:   { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', leftColor: '#D97706' },
  LOW:      { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', leftColor: '#2563EB' },
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D8E7F0',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(18,48,74,0.05)',
  overflow: 'hidden',
};

const thStyle = {
  padding: '16px 24px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#64748B',
  borderBottom: '1px solid #D8E7F0',
  backgroundColor: '#F8FAFC',
};

export default function Alerts() {
  const { selectedStation } = useStation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    if (selectedStation) fetchAlerts();

    const handleCreated = (newAlert) => {
      setAlerts(prev => {
        // Prevent duplicates
        if (prev.find(a => a._id === newAlert._id)) return prev;
        return [newAlert, ...prev];
      });
    };

    const handleUpdated = (updatedAlert) => {
      setAlerts(prev => prev.map(a => a._id === updatedAlert._id ? updatedAlert : a));
      if (selectedAlert?._id === updatedAlert._id) {
        setSelectedAlert(updatedAlert);
      }
    };

    socket.on('alert:created', handleCreated);
    socket.on('alert:updated', handleUpdated);

    return () => {
      socket.off('alert:created', handleCreated);
      socket.off('alert:updated', handleUpdated);
    };
  }, [selectedStation, selectedAlert]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/alerts?stationId=${selectedStation._id}&_t=${Date.now()}`);
      setAlerts(res.data.data);
    } catch (err) {
      console.error(err);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedStation) fetchAlerts();
  }, [selectedStation]);

  const updateStatus = async (id, status, actionPlan = null) => {
    try {
      let endpoint = 'acknowledge';
      if (status === 'RESOLVED') endpoint = 'resolve';
      else if (status === 'ACTION_PLANNED') endpoint = 'action-planned';

      const res = await client.post(`/alerts/${id}/${endpoint}`, actionPlan ? { actionPlan } : {});
      // Socket will broadcast the update, but we can also update locally for immediate feedback
      setAlerts(prev => prev.map(a => a._id === id ? res.data.data : a));
      if (selectedAlert && selectedAlert._id === id) {
        setSelectedAlert(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPIs
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter(a => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length;
  const actionPlannedCount = alerts.filter(a => a.status === 'ACTION_PLANNED').length;
  const ackCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (search && !a.assetId?.name?.toLowerCase().includes(search.toLowerCase()) && 
        !a.message?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#12304A', margin: '0 0 8px' }}>
          Operational Alerts
        </h1>
        <p style={{ fontSize: '16px', color: '#64748B', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
          Monitor and respond to equipment anomalies, predicted failures, and cascading risks.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'ACTIVE ALERTS', value: activeCount, color: '#12304A', bg: '#F8FAFC' },
          { label: 'CRITICAL', value: criticalCount, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'ACTION PLANNED', value: actionPlannedCount, color: '#0D9488', bg: '#F0FDFA' },
          { label: 'ACKNOWLEDGED', value: ackCount, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'RESOLVED', value: resolvedCount, color: '#16A34A', bg: '#F0FDF4' },
        ].map((kpi, idx) => (
          <div key={idx} style={{
            backgroundColor: '#FFFFFF', border: '1px solid #D8E7F0',
            borderRadius: '12px', padding: '20px',
            boxShadow: '0 2px 8px rgba(18,48,74,0.04)',
          }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              {kpi.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                backgroundColor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldAlert style={{ width: '22px', height: '22px', color: kpi.color }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFFFF', padding: '16px 24px', borderRadius: '12px', border: '1px solid #D8E7F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, backgroundColor: '#F8FAFC', padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <Search size={18} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Search by asset or message..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '15px', color: '#1E3448' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748B" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Severity:</span>
          <select 
            value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 500, outline: 'none' }}
          >
            {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Status:</span>
          <select 
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 500, outline: 'none' }}
          >
            {['All', 'ACTIVE', 'ACKNOWLEDGED', 'ACTION_PLANNED', 'RESOLVED'].map(o => (
              <option key={o} value={o}>{o === 'All' ? 'All' : o.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center', color: '#64748B', fontSize: '16px', fontWeight: 500 }}>
            Loading alerts…
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <ShieldAlert style={{ width: '56px', height: '56px', color: '#CBD5E1', margin: '0 auto 20px', display: 'block' }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#1E3448', margin: '0 0 8px' }}>All systems operating normally.</p>
            <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>No alerts match the current criteria.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Severity', 'Asset', 'Alert', 'Risk / Failure', 'Decision', 'Time', 'Status', 'Action'].map((col, i) => (
                  <th key={col} style={{ ...thStyle, textAlign: i === 7 ? 'right' : 'left' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map(alert => {
                const isResolved = alert.status === 'RESOLVED';
                const s = isResolved 
                    ? { text: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', leftColor: '#CBD5E1' }
                    : (sevStyle[alert.severity] || sevStyle.LOW);

                return (
                  <tr 
                    key={alert._id} 
                    style={{ 
                        borderLeft: `4px solid ${s.leftColor}`, 
                        cursor: 'pointer', 
                        transition: 'background-color 0.1s',
                        opacity: isResolved ? 0.7 : 1,
                        backgroundColor: isResolved ? '#F8FAFC' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isResolved ? '#F1F5F9' : '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isResolved ? '#F8FAFC' : 'transparent'}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                        padding: '6px 12px', borderRadius: '6px',
                        color: s.text, backgroundColor: s.bg, border: `1px solid ${s.border}`,
                      }}>
                        {alert.severity}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: isResolved ? '#64748B' : '#1E3448', marginBottom: '4px' }}>
                        {alert.assetName || alert.assetId?.name || alert.assetId?.assetId}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                        {alert.stationId?.name}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', fontSize: '15px', color: isResolved ? '#64748B' : '#1E3448', fontWeight: 600, maxWidth: '280px' }}>
                      <span style={{ textDecoration: isResolved ? 'line-through' : 'none' }}>
                        {alert.message}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: s.text, marginBottom: '4px' }}>
                        Risk: {alert.riskLevel || 'N/A'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                        Fail Prob: {alert.failureProbability !== undefined ? `${Math.round(alert.failureProbability * 100)}%` : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', fontSize: '14px', fontWeight: 700, color: isResolved ? '#94A3B8' : '#1E3448' }}>
                      {alert.decisionPriority || 'N/A'}
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', fontSize: '14px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br/>
                      <span style={{ fontSize: '12px' }}>{new Date(alert.timestamp).toLocaleDateString()}</span>
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', fontSize: '13px', fontWeight: 800 }}>
                      <span style={{ 
                        color: alert.status === 'RESOLVED' ? '#16A34A' : 
                               alert.status === 'ACKNOWLEDGED' ? '#2563EB' : 
                               alert.status === 'ACTION_PLANNED' ? '#0D9488' : '#DC2626',
                        backgroundColor: alert.status === 'RESOLVED' ? '#F0FDF4' : 
                                         alert.status === 'ACKNOWLEDGED' ? '#EFF6FF' : 
                                         alert.status === 'ACTION_PLANNED' ? '#F0FDFA' : '#FEF2F2',
                        border: `1px solid ${
                          alert.status === 'RESOLVED' ? '#BBF7D0' : 
                          alert.status === 'ACKNOWLEDGED' ? '#BFDBFE' : 
                          alert.status === 'ACTION_PLANNED' ? '#99F6E4' : '#FECACA'
                        }`,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {alert.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); }}
                        style={{
                          fontSize: '14px', fontWeight: 600, padding: '8px 16px',
                          borderRadius: '8px', cursor: 'pointer',
                          backgroundColor: '#FFFFFF', color: '#2563EB',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        View Alert
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedAlert && (
        <AlertDetailDrawer 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}
