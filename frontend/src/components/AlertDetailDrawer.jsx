import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldAlert, Brain, Activity, Compass } from 'lucide-react';
import client from '../api/client';

export default function AlertDetailDrawer({ alert, onClose, onUpdateStatus }) {
  const navigate = useNavigate();
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState(alert?.explanation || '');
  const [explainError, setExplainError] = useState(null);

  if (!alert) return null;

  const handleExplain = async () => {
    setExplaining(true);
    setExplainError(null);
    try {
      const res = await client.post(`/alerts/${alert._id}/explain`);
      setExplanation(res.data.data.analysis);
      // Update local alert object so it persists while modal is open
      alert.explanation = res.data.data.analysis;
    } catch (err) {
      setExplainError('AI explanation temporarily unavailable.');
    } finally {
      setExplaining(false);
    }
  };

  const riskColors = {
    LOW: '#16A34A',
    MEDIUM: '#D97706',
    HIGH: '#DC2626',
    CRITICAL: '#991B1B'
  };

  const rc = riskColors[alert.riskLevel] || '#12304A';

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(18,48,74,0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 40,
        }}
      />
      <div
        className="slide-in-right"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '560px',
          maxWidth: '90vw',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #D8E7F0',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(18,48,74,0.12)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 32px', borderBottom: '1px solid #D8E7F0', flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: '6px', 
                backgroundColor: alert.status === 'RESOLVED' ? '#F0FDF4' : '#FEF2F2', 
                color: alert.status === 'RESOLVED' ? '#16A34A' : '#DC2626',
                border: `1px solid ${alert.status === 'RESOLVED' ? '#BBF7D0' : '#FECACA'}`
              }}>
                {alert.severity} ALERT
              </span>
              <span style={{ 
                fontSize: '13px', fontWeight: 800, 
                color: alert.status === 'RESOLVED' ? '#16A34A' : '#64748B' 
              }}>
                {alert.status}
              </span>
            </div>
            <h2 style={{ 
                fontSize: '24px', fontWeight: 800, margin: '0 0 4px',
                color: alert.status === 'RESOLVED' ? '#94A3B8' : '#12304A',
                textDecoration: alert.status === 'RESOLVED' ? 'line-through' : 'none'
            }}>
              {alert.assetName || alert.assetId?.name || alert.assetId?.assetId || 'Unknown Asset'}
            </h2>
            <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
              {alert.stationId?.name}
            </p>
          </div>
          <button onClick={onClose} style={{
              padding: '10px', background: 'none', border: '1px solid #D8E7F0',
              borderRadius: '8px', cursor: 'pointer', color: '#64748B',
            }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>
                Risk Level
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: rc }}>
                {alert.riskLevel || 'UNKNOWN'}
              </div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>
                Decision Priority
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#12304A' }}>
                {alert.decisionPriority || 'UNKNOWN'}
              </div>
            </div>
            
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>
                Anomaly Score
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1E3448' }}>
                {alert.anomalyScore !== undefined ? `${Math.round(alert.anomalyScore * 100)}%` : 'N/A'}
              </div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>
                Failure Probability
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1E3448' }}>
                {alert.failureProbability !== undefined ? `${Math.round(alert.failureProbability * 100)}%` : 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E3448', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Why This Alert Was Created
            </h3>
            <div style={{ backgroundColor: '#EFF6FF', padding: '20px', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1E3448', margin: '0 0 16px' }}>
                {alert.message}
              </p>
              
              {explanation ? (
                <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
                  {explanation}
                </div>
              ) : (
                <div>
                  <button 
                    onClick={handleExplain}
                    disabled={explaining}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', backgroundColor: '#FFFFFF', color: '#2563EB',
                      border: '1px solid #2563EB', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                      cursor: explaining ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Brain size={18} />
                    {explaining ? 'Generating operational explanation...' : 'Explain Decision (AI)'}
                  </button>
                  {explainError && <div style={{ color: '#DC2626', fontSize: '13px', marginTop: '10px', fontWeight: 500 }}>{explainError}</div>}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E3448', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cascade Impact
            </h3>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Activity size={18} color="#2563EB" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E3448' }}>Direct Risk:</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: rc }}>{alert.assetName || alert.assetId?.assetId}</span>
              </div>
              
              {alert.affectedAssets && alert.affectedAssets.length > 0 ? (
                <div style={{ paddingLeft: '14px', borderLeft: '2px solid #CBD5E1', marginLeft: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Dependency / Cascade Risk:</div>
                  {alert.affectedAssets.map(ast => (
                    <div key={ast} style={{ fontSize: '15px', fontWeight: 600, color: '#D97706', marginBottom: '6px' }}>
                      ↳ {ast}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#64748B', marginTop: '12px' }}>
                  No cascading downstream impacts detected.
                </div>
              )}
            </div>
          </div>

        </div>

        <div style={{
          padding: '20px 28px', borderTop: '1px solid #D8E7F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
          backgroundColor: '#F8FAFC'
        }}>
          <div>
            <button
              onClick={() => {
                onClose();
                navigate(`/decision-center?alertId=${alert._id}`);
              }}
              style={{
                fontSize: '14px', fontWeight: 700, padding: '10px 18px',
                borderRadius: '8px', cursor: 'pointer',
                backgroundColor: '#2563EB', color: '#FFFFFF',
                border: 'none', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Compass size={16} /> View Decision Center
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {alert.status === 'ACTIVE' && (
              <button
                onClick={() => onUpdateStatus(alert._id, 'ACKNOWLEDGED')}
                style={{
                  fontSize: '13px', fontWeight: 600, padding: '10px 16px',
                  borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: '#FFFFFF', color: '#2563EB',
                  border: '1px solid #BFDBFE'
                }}
              >
                Acknowledge
              </button>
            )}

            {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
              <button
                onClick={() => onUpdateStatus(alert._id, 'ACTION_PLANNED')}
                style={{
                  fontSize: '13px', fontWeight: 600, padding: '10px 16px',
                  borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: '#EFF6FF', color: '#2563EB',
                  border: '1px solid #BFDBFE'
                }}
              >
                Mark Action Planned
              </button>
            )}

            {alert.status !== 'RESOLVED' && (
              <button
                onClick={() => onUpdateStatus(alert._id, 'RESOLVED')}
                style={{
                  fontSize: '13px', fontWeight: 600, padding: '10px 16px',
                  borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: '#16A34A', color: '#FFFFFF',
                  border: 'none'
                }}
              >
                Resolve Alert
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
