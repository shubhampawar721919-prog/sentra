import { useAuth } from '../contexts/AuthContext';
import { useStation } from '../contexts/StationContext';
import { User2, MapPin, Bell, Shield, Activity } from 'lucide-react';
import PingPongMonitor from '../components/PingPongMonitor';
import ScadaGatewayConsole from '../components/ScadaGatewayConsole';

const sectionStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D8E7F0',
  borderRadius: '10px',
  boxShadow: '0 1px 3px rgba(18,48,74,0.06)',
  overflow: 'hidden',
};

const sectionHeaderStyle = {
  display: 'flex', alignItems: 'center', gap: '12px',
  padding: '16px 24px', borderBottom: '1px solid #D8E7F0',
  backgroundColor: '#F6FAFD',
};

const fieldStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 0',
  borderBottom: '1px solid #F1F5F9',
};

const Section = ({ icon: Icon, title, children }) => (
  <div style={sectionStyle}>
    <div style={sectionHeaderStyle}>
      <Icon style={{ width: '20px', height: '20px', color: '#2563EB' }} />
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E3448', margin: 0 }}>{title}</h2>
    </div>
    <div style={{ padding: '8px 24px 16px' }}>{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div style={fieldStyle}>
    <span style={{ fontSize: '15px', color: '#64748B' }}>{label}</span>
    <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E3448' }}>{value || '—'}</span>
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const { selectedStation } = useStation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px' }}>
      <div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#12304A', margin: '0 0 6px' }}>
          Settings & Diagnostics
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          System configuration, live service connectivity, and heartbeat latency diagnostics
        </p>
      </div>

      {/* Interactive Ping-Pong Point */}
      <PingPongMonitor />

      {/* Industrial SCADA & Modbus Gateway Inspector */}
      <ScadaGatewayConsole />

      <Section icon={User2} title="Account">
        <Field label="Name"  value={user?.name}  />
        <Field label="Email" value={user?.email} />
        <Field label="Role"  value={user?.role}  />
      </Section>

      <Section icon={MapPin} title="Station Configuration">
        <Field label="Active Station" value={selectedStation?.name}     />
        <Field label="Location"       value={selectedStation?.location} />
        <Field label="Status"         value={selectedStation?.status}   />
      </Section>

      <Section icon={Bell} title="Alert Notification Routing">
        <Field label="Critical Alert Dispatch"   value="Active (WebSockets + Console Broadcast)" />
        <Field label="Cascade Warning Threshold" value="Resilience < 60 or Downstream Threat"   />
        <Field label="Polar Telemetry Heartbeat" value="Synchronized (Continuous 10s Link)"     />
      </Section>

      <Section icon={Shield} title="Security">
        <Field label="Auth Method" value="JWT / HTTP-only cookies" />
        <Field label="Session"     value="Active"                  />
      </Section>
    </div>
  );
}
