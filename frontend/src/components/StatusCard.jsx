const colorConfig = {
  blue:  { icon: '#2563EB', iconBg: '#EFF6FF', iconBorder: '#BFDBFE', accent: '#2563EB', bar: '#2563EB' },
  green: { icon: '#16A34A', iconBg: '#F0FDF4', iconBorder: '#BBF7D0', accent: '#16A34A', bar: '#16A34A' },
  amber: { icon: '#D97706', iconBg: '#FFFBEB', iconBorder: '#FDE68A', accent: '#D97706', bar: '#D97706' },
  red:   { icon: '#DC2626', iconBg: '#FEF2F2', iconBorder: '#FECACA', accent: '#DC2626', bar: '#DC2626' },
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D8E7F0',
  borderRadius: '10px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(18,48,74,0.06)',
  position: 'relative',
  overflow: 'hidden',
};

export default function StatusCard({ title, value, unit, icon: Icon, trend, color = 'blue' }) {
  const c = colorConfig[color] || colorConfig.blue;
  return (
    <div style={cardStyle}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        backgroundColor: c.bar,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', margin: 0 }}>
          {title}
        </p>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          backgroundColor: c.iconBg,
          border: `1px solid ${c.iconBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: '20px', height: '20px', color: c.icon }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '36px', fontWeight: 700, color: c.accent, lineHeight: 1 }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '16px', color: '#64748B', fontWeight: 500 }}>{unit}</span>
        )}
      </div>

      {trend && (
        <p style={{ fontSize: '13px', marginTop: '10px', fontWeight: 500, color: trend.isPositive ? '#16A34A' : '#DC2626' }}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}% from last reading
        </p>
      )}
    </div>
  );
}
