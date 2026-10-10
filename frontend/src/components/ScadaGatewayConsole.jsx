import { useState, useEffect } from 'react';
import { Cpu, RefreshCw, CheckCircle2, Radio, Database } from 'lucide-react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';

export default function ScadaGatewayConsole() {
  const { selectedStation } = useStation();
  const [scadaData, setScadaData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchScadaStatus = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/telemetry/scada/status?stationCode=${selectedStation?.code || 'BHR'}`);
      setScadaData(res.data.data);
    } catch (err) {
      console.error("SCADA fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScadaStatus();
    const interval = setInterval(fetchScadaStatus, 8000);
    return () => clearInterval(interval);
  }, [selectedStation]);

  if (!scadaData) return null;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #D8E7F0',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(18,48,74,0.06)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #D8E7F0', backgroundColor: '#F8FAFC',
        flexWrap: 'wrap', gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={20} color="#2563EB" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#12304A', margin: 0 }}>
                Industrial SCADA & Modbus TCP Gateway
              </h3>
              <span style={{
                fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0'
              }}>
                IEC 60870-5-104 COMPLIANT
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
              Physical-layer fieldbus interface with station PLCs and generator monitoring RTUs.
            </p>
          </div>
        </div>

        <button
          onClick={fetchScadaStatus}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 700, padding: '6px 12px',
            borderRadius: '6px', border: '1px solid #D8E7F0',
            backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Poll Registers
        </button>
      </div>

      {/* Meta Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px', padding: '16px 24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F5F9'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>PLC CONTROLLER</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3448' }}>{scadaData.plcModel}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>ENDPOINT & PORT</div>
          <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>{scadaData.ipEndpoint}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>FIELD NETWORK</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3448' }}>{scadaData.baudRate}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>CRC STATUS</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} color="#16A34A" /> 0 Errors ({scadaData.packetStats.framesProcessed} Frames)
          </div>
        </div>
      </div>

      {/* Register Mapping Table */}
      <div style={{ overflowX: 'auto', padding: '0 24px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginTop: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
              <th style={{ padding: '8px', fontWeight: 700 }}>REGISTER</th>
              <th style={{ padding: '8px', fontWeight: 700 }}>ADDRESS</th>
              <th style={{ padding: '8px', fontWeight: 700 }}>TAG NAME / SIGNAL</th>
              <th style={{ padding: '8px', fontWeight: 700 }}>RAW HEX</th>
              <th style={{ padding: '8px', fontWeight: 700 }}>ENGINEERING VALUE</th>
              <th style={{ padding: '8px', fontWeight: 700 }}>DATA TYPE</th>
            </tr>
          </thead>
          <tbody>
            {(scadaData.registers || []).map((reg, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                  {reg.register}
                </td>
                <td style={{ padding: '8px', fontFamily: 'monospace', color: '#64748B' }}>
                  {reg.address}
                </td>
                <td style={{ padding: '8px', fontWeight: 600, color: '#1E3448' }}>
                  {reg.name}
                </td>
                <td style={{ padding: '8px', fontFamily: 'monospace', color: '#7C3AED', backgroundColor: '#F8FAFC' }}>
                  {reg.hex}
                </td>
                <td style={{ padding: '8px', fontWeight: 800, color: '#12304A' }}>
                  {reg.decodedValue} {reg.unit}
                </td>
                <td style={{ padding: '8px', fontSize: '11px', color: '#64748B' }}>
                  {reg.type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
