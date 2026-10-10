import { useState, useEffect } from 'react';
import { X, Radio, Wifi, WifiOff, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SatcomEdgeModal({ isOpen, onClose, isBlackout, onToggleBlackout, bufferedCount }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(18,48,74,0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 50,
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '640px',
        maxWidth: '92vw',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 20px 48px rgba(18,48,74,0.18)',
        border: '1px solid #D8E7F0',
        zIndex: 60,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #D8E7F0',
          backgroundColor: isBlackout ? '#FEF2F2' : '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: isBlackout ? '#FEE2E2' : '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isBlackout ? <WifiOff size={20} color="#DC2626" /> : <Radio size={20} color="#2563EB" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#12304A' }}>
                  Polar SATCOM & Edge Server Architecture
                </h3>
                <span style={{
                  fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                  backgroundColor: isBlackout ? '#FEF2F2' : '#F0FDF4',
                  color: isBlackout ? '#DC2626' : '#16A34A',
                  border: `1px solid ${isBlackout ? '#FECACA' : '#BBF7D0'}`
                }}>
                  {isBlackout ? 'EDGE-AUTONOMOUS' : 'UPLINK ONLINE'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
                Geostationary satellite telemetry mirror & on-premise polar station fallback.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ padding: '8px', background: 'none', border: '1px solid #D8E7F0', borderRadius: '8px', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Interactive Simulation Switch */}
          <div style={{
            padding: '16px', borderRadius: '10px',
            backgroundColor: isBlackout ? '#FFFBEB' : '#F8FAFC',
            border: `1px solid ${isBlackout ? '#FDE68A' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E3448' }}>
                Simulate Polar Storm SATCOM Blackout
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Emulates high-latitude Ku-band rain/snow fade. Station transitions to local store-and-forward queue.
              </div>
            </div>

            <button
              onClick={onToggleBlackout}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: isBlackout ? '#16A34A' : '#DC2626',
                color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {isBlackout ? 'Restore Satellite Link' : 'Simulate Blackout'}
            </button>
          </div>

          {/* Active SATCOM & Edge Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>SATELLITE TRANSPONDER</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E3448', margin: '3px 0' }}>Ku-Band VSAT (GSAT)</div>
              <div style={{ fontSize: '11px', color: isBlackout ? '#DC2626' : '#16A34A' }}>
                {isBlackout ? 'Signal Faded (0 dB)' : 'Carrier Lock (14.2 dB)'}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>BANDWIDTH / LATENCY</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E3448', margin: '3px 0' }}>
                {isBlackout ? '0 kbps / Offline' : '256 kbps · 640 ms'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {isBlackout ? 'Polar storm blackout' : 'Geostationary polar delay'}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>ON-STATION EDGE ENGINE</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#16A34A', margin: '3px 0' }}>Fully Autonomous</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Local ML & safety watchdog</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>STORE-AND-FORWARD QUEUE</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: isBlackout ? '#D97706' : '#1E3448', margin: '3px 0' }}>
                {bufferedCount} Frames Buffered
              </div>
              <div style={{ fontSize: '11px', color: isBlackout ? '#B45309' : '#16A34A' }}>
                {isBlackout ? 'Buffering on SSD cache' : 'Fully synchronized with Goa'}
              </div>
            </div>
          </div>

          {/* Architecture Explanation Card */}
          <div style={{
            backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD',
            borderRadius: '10px', padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldCheck size={16} color="#0284C7" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369A1' }}>
                Edge-First Resilient Architecture
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#0C4A6E', margin: 0, lineHeight: '1.5' }}>
              SENTRA does not depend on uninterrupted internet. The entire Node.js backend, Python FastAPI ML service, and MongoDB database run on an on-premise ruggedized edge server inside the Antarctic station. When satellite links drop during -45°C blizzards, the station commander retains 100% digital twin capability, fault detection, and what-if simulation locally.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
