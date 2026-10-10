import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { socket } from '../App';
import { Activity, Radio, Cpu, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PingPongMonitor() {
  const [loading, setLoading] = useState(false);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [results, setResults] = useState({
    http: { status: 'idle', latencyMs: null },
    ws: { status: 'idle', latencyMs: null },
    ml: { status: 'idle', latencyMs: null },
    db: { status: 'idle', latencyMs: null },
  });

  const runPingTest = useCallback(async () => {
    setLoading(true);
    const pingStart = Date.now();

    // 1. WebSocket Ping-Pong
    let wsLatency = null;
    let wsStatus = 'offline';
    try {
      const wsPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('WS Timeout')), 2500);
        const wsStart = Date.now();

        socket.once('pong', () => {
          clearTimeout(timeout);
          resolve(Date.now() - wsStart);
        });

        socket.emit('ping', { timestamp: wsStart });
      });

      wsLatency = await wsPromise;
      wsStatus = 'pong';
    } catch {
      wsStatus = 'timeout';
    }

    // 2. HTTP Backend + ML + DB Ping-Pong
    let httpLatency = null;
    let httpStatus = 'offline';
    let mlData = { status: 'offline', latencyMs: null };
    let dbData = { status: 'offline', latencyMs: null };

    try {
      const httpStart = Date.now();
      const res = await client.get(`/ping?_t=${httpStart}`);
      httpLatency = Date.now() - httpStart;
      httpStatus = res.data?.status === 'pong' ? 'pong' : 'ok';

      if (res.data?.dependencies) {
        mlData = res.data.dependencies.ml || mlData;
        dbData = res.data.dependencies.database || dbData;
      }
    } catch {
      httpStatus = 'failed';
    }

    setResults({
      http: { status: httpStatus, latencyMs: httpLatency },
      ws: { status: wsStatus, latencyMs: wsLatency },
      ml: { status: mlData.status, latencyMs: mlData.latencyMs },
      db: { status: dbData.status, latencyMs: dbData.latencyMs },
    });

    setLastPingTime(new Date());
    setLoading(false);
  }, []);

  // Run initial ping once on mount
  useEffect(() => {
    runPingTest();
  }, [runPingTest]);

  const allPong = results.http.status === 'pong' &&
                  results.ws.status === 'pong' &&
                  results.ml.status === 'pong' &&
                  results.db.status === 'pong';

  const getBadgeStyle = (status) => {
    if (status === 'pong') return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'PONG' };
    if (status === 'idle') return { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', label: 'IDLE' };
    return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: status.toUpperCase() };
  };

  const services = [
    {
      id: 'http',
      name: 'Node.js Backend API',
      protocol: 'HTTP REST /api/ping',
      icon: Activity,
      status: results.http.status,
      latency: results.http.latencyMs,
      desc: 'Core Express application server and route controller'
    },
    {
      id: 'ws',
      name: 'Socket.IO Real-Time Engine',
      protocol: 'WebSocket WSS Ping-Pong',
      icon: Radio,
      status: results.ws.status,
      latency: results.ws.latencyMs,
      desc: 'Real-time incident dispatches and live telemetry streaming'
    },
    {
      id: 'ml',
      name: 'Python FastAPI ML Layer',
      protocol: 'HTTP :8000/ping',
      icon: Cpu,
      status: results.ml.status,
      latency: results.ml.latencyMs,
      desc: 'Isolation Forest anomaly detection & XGBoost failure prediction'
    },
    {
      id: 'db',
      name: 'MongoDB Database',
      protocol: 'Driver admin().ping()',
      icon: Database,
      status: results.db.status,
      latency: results.db.latencyMs,
      desc: 'Persistent station models, asset topology, and telemetry time series'
    }
  ];

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #D8E7F0',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(18,48,74,0.05)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #D8E7F0',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={18} color="#2563EB" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#12304A', margin: 0 }}>
              System Ping-Pong & Service Latency Monitor
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Real-time roundtrip heartbeats across Frontend, Backend, Python ML & Database
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '20px',
            backgroundColor: allPong ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${allPong ? '#BBF7D0' : '#FECACA'}`,
            fontSize: '12px', fontWeight: 700,
            color: allPong ? '#166534' : '#991B1B'
          }}>
            {allPong ? <CheckCircle2 size={14} color="#16A34A" /> : <AlertCircle size={14} color="#DC2626" />}
            <span>{allPong ? 'ALL 4 SERVICES OPERATIONAL' : 'DEGRADED CONNECTIVITY'}</span>
          </div>

          {/* Trigger Ping Button */}
          <button
            onClick={runPingTest}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px',
              backgroundColor: '#2563EB', color: '#FFFFFF',
              border: 'none', fontSize: '13px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Pinging...' : '🏓 Ping All Services'}
          </button>
        </div>
      </div>

      {/* Grid of 4 Service Ping Cards */}
      <div style={{
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {services.map(srv => {
          const Icon = srv.icon;
          const badge = getBadgeStyle(srv.status);

          return (
            <div
              key={srv.id}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={15} color="#2563EB" />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E3448' }}>{srv.name}</span>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}>
                    {badge.label}
                  </span>
                </div>

                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B', marginBottom: '6px' }}>
                  {srv.protocol}
                </div>

                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                  {srv.desc}
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderTop: '1px solid #E2E8F0', paddingTop: '10px', marginTop: '4px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Roundtrip Latency:</span>
                <strong style={{
                  fontSize: '14px',
                  color: srv.latency !== null && srv.latency < 50 ? '#16A34A' : srv.latency < 150 ? '#D97706' : '#DC2626'
                }}>
                  {srv.latency !== null ? `${srv.latency} ms` : '—'}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Timestamp */}
      {lastPingTime && (
        <div style={{
          padding: '10px 24px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#94A3B8'
        }}>
          <span>Last full ping cycle executed:</span>
          <span style={{ fontWeight: 600, color: '#64748B' }}>
            {lastPingTime.toLocaleTimeString()} ({lastPingTime.toLocaleDateString()})
          </span>
        </div>
      )}
    </div>
  );
}
