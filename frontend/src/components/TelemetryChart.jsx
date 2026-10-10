import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D8E7F0',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(18,48,74,0.1)',
      }}>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>{label}</p>
        <p style={{ fontSize: '16px', fontWeight: 700, color }}>
          {payload[0].value?.toFixed(2)}{unit ? ` ${unit}` : ''}
        </p>
      </div>
    );
  }
  return null;
};

export default function TelemetryChart({ data, title, dataKey, color = '#2563EB', unit, hideTitle }) {
  const gradientId = `grad-${dataKey}`;
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: hideTitle ? 'transparent' : '#FFFFFF',
      border: hideTitle ? 'none' : '1px solid #D8E7F0',
      borderRadius: hideTitle ? 0 : '10px',
      overflow: 'hidden',
      boxShadow: hideTitle ? 'none' : '0 1px 3px rgba(18,48,74,0.06)',
    }}>
      {!hideTitle && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #D8E7F0', flexShrink: 0,
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E3448', margin: 0 }}>{title}</h3>
          {unit && (
            <span style={{
              fontSize: '13px', color: '#64748B', fontWeight: 500,
              padding: '3px 10px', backgroundColor: '#F6FAFD',
              border: '1px solid #D8E7F0', borderRadius: '6px',
            }}>{unit}</span>
          )}
        </div>
      )}
      <div style={{ flex: 1, padding: '12px 8px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="transparent"
              tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              content={<CustomTooltip unit={unit} color={color} />}
              cursor={{ stroke: 'rgba(37,99,235,0.2)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
