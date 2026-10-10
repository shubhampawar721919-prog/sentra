import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertCard({ alerts = [] }) {
  const getStyle = (severity) => {
    switch(severity) {
      case 'CRITICAL': case 'HIGH': return { icon: AlertTriangle, color: 'text-red', bg: 'bg-red/10' };
      case 'MEDIUM': return { icon: AlertCircle, color: 'text-amber', bg: 'bg-amber/10' };
      default: return { icon: Info, color: 'text-blue', bg: 'bg-blue/10' };
    }
  };
  return (
    <div className="bg-bg-elevated border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-txt-primary">Recent Alerts</h3>
        <span className="text-xs text-txt-muted">{alerts.length} active</span>
      </div>
      <div className="space-y-2">
        {alerts.map(a => { const { icon: Icon, color, bg } = getStyle(a.severity); return (
          <div key={a._id || a.id} className={`flex items-start gap-3 p-3 ${bg} rounded-lg`}>
            <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm text-txt-primary">{a.message}</p>
              <p className="text-xs text-txt-muted mt-0.5">{a.assetId?.name || a.assetId} • {new Date(a.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ); })}
        {alerts.length === 0 && <p className="text-txt-muted text-sm text-center py-4">No active alerts</p>}
      </div>
    </div>
  );
}
