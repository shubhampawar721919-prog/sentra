import os

# 1. StatusCard (Update for light theme)
with open("frontend/src/components/StatusCard.jsx", "w") as f:
    f.write("""export default function StatusCard({ title, value, unit, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary bg-ice border-iceDark',
    secondary: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-muted text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline space-x-1">
        <span className="text-3xl font-bold text-navy">{value}</span>
        {unit && <span className="text-muted font-medium">{unit}</span>}
      </div>
      
      {trend && (
        <div className={`text-xs mt-3 font-medium flex items-center ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
          <span className="mr-1">{trend.isPositive ? '▲' : '▼'}</span> 
          {trend.value}% from last hour
        </div>
      )}
    </div>
  );
}
""")

# 2. Dashboard
with open("frontend/src/pages/Dashboard.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import { Thermometer, Zap, Activity, Battery, Box, AlertTriangle } from 'lucide-react';
import StatusCard from '../components/StatusCard';
import TelemetryChart from '../components/TelemetryChart';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';

export default function Dashboard() {
  const { selectedStation } = useStation();
  const [assets, setAssets] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedStation) {
      fetchDashboardData();
    }
  }, [selectedStation]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const assetsRes = await client.get(`/stations/${selectedStation._id}/assets`);
      const fetchedAssets = assetsRes.data.data;
      setAssets(fetchedAssets);

      const alertsRes = await client.get(`/alerts?stationId=${selectedStation._id}&status=ACTIVE`);
      setAlerts(alertsRes.data.data);

      const mainGenerator = fetchedAssets.find(a => a.type.includes('Generator') || a.assetId.includes('DG'));
      
      if (mainGenerator) {
        const telRes = await client.get(`/telemetry/${mainGenerator._id}?limit=24`);
        const formatted = telRes.data.data.map(t => ({
          time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: t.temperature || 0,
          power: t.powerOutput || 0,
          vibration: t.vibration || 0
        }));
        setTelemetry(formatted);
      } else {
        setTelemetry([]);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load station data');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStation) return <div className="p-8 text-center text-muted">Loading station context...</div>;
  if (error) return <div className="p-8 text-center text-danger font-medium">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">{selectedStation.name} Overview</h1>
          <p className="text-muted mt-1 font-medium">{selectedStation.location}</p>
        </div>
        <div className="text-sm font-medium text-primary bg-ice px-3 py-1 rounded border border-iceDark">
          ● LIVE
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatusCard 
          title="Ext. Temperature" 
          value="-14.2" 
          unit="°C" 
          icon={Thermometer} 
          color="primary"
          trend={{ isPositive: false, value: 2.1 }}
        />
        <StatusCard 
          title="Power Output" 
          value={telemetry.length > 0 ? Math.round(telemetry[telemetry.length-1].power) : '--'} 
          unit="kW" 
          icon={Zap} 
          color="primary"
        />
        <StatusCard 
          title="Active Assets" 
          value={assets.length}
          unit="" 
          icon={Box} 
          color="secondary"
        />
        <StatusCard 
          title="Active Alerts" 
          value={alerts.length}
          unit="" 
          icon={AlertTriangle} 
          color={alerts.length > 0 ? "warning" : "secondary"}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="h-80">
           <TelemetryChart 
             data={telemetry} 
             title="Main Generator Power (24h)" 
             dataKey="power" 
             color="#2563EB"
             unit="kW"
           />
        </div>
        <div className="h-80">
           <TelemetryChart 
             data={telemetry} 
             title="Main Generator Vibration (24h)" 
             dataKey="vibration" 
             color="#38BDF8"
             unit="mm/s"
           />
        </div>
      </div>
    </div>
  );
}
""")

# 3. Assets Page
with open("frontend/src/pages/Assets.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import AssetDetailPanel from '../components/AssetDetailPanel';
import { Search, Filter } from 'lucide-react';

export default function Assets() {
    const { selectedStation } = useStation();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (selectedStation) {
            fetchAssets();
        }
    }, [selectedStation]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await client.get(`/stations/${selectedStation._id}/assets`);
            setAssets(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.assetId.toLowerCase().includes(search.toLowerCase()));

    const getStatusColor = (status) => {
        switch(status) {
            case 'NORMAL': return 'text-success bg-success/10 border-success/20';
            case 'WARNING': return 'text-warning bg-warning/10 border-warning/20';
            case 'CRITICAL': return 'text-danger bg-danger/10 border-danger/20';
            default: return 'text-muted bg-gray-100 border-gray-200';
        }
    };

    if (!selectedStation) return <div className="text-muted">Loading station context...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-navy tracking-tight">Asset Management</h1>
            </div>

            <div className="flex space-x-4 bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-muted w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="Search assets..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-navy"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className="flex items-center px-4 py-2 border border-border rounded-lg bg-gray-50 text-navy font-medium hover:bg-gray-100 transition-colors">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                </button>
            </div>

            {loading ? (
                <div className="text-center p-10 text-muted">Loading assets...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(asset => (
                        <div 
                            key={asset._id} 
                            onClick={() => setSelectedAsset(asset)}
                            className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-navy font-bold text-lg">{asset.name}</h3>
                                    <p className="text-muted text-xs mt-1 font-medium">{asset.assetId} • {asset.type}</p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(asset.status)}`}>
                                    {asset.status}
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                                <span className="text-xs uppercase text-muted font-bold tracking-wider">Criticality</span>
                                <span className="text-sm font-bold text-navy">{asset.criticality}</span>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="col-span-full p-10 text-center text-muted bg-white rounded-xl border border-dashed border-gray-300">No assets found.</div>}
                </div>
            )}

            <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
        </div>
    );
}
""")

# 4. Alerts
with open("frontend/src/pages/Alerts.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';

export default function Alerts() {
    const { selectedStation } = useStation();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedStation) {
            fetchAlerts();
        }
    }, [selectedStation]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await client.get(`/alerts?stationId=${selectedStation._id}`);
            setAlerts(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await client.patch(`/alerts/${id}`, { status });
            fetchAlerts(); // refresh
        } catch (err) {
            console.error(err);
        }
    };

    const getSeverityColor = (sev) => {
        switch(sev) {
            case 'CRITICAL': return 'bg-danger text-white border-danger';
            case 'HIGH': return 'bg-danger/10 text-danger border-danger/20';
            case 'MEDIUM': return 'bg-warning/10 text-warning border-warning/20';
            default: return 'bg-success/10 text-success border-success/20';
        }
    };

    if (!selectedStation) return <div className="text-muted">Loading station context...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-navy tracking-tight">System Alerts</h1>
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-muted">Loading alerts...</div>
                ) : (
                    <table className="w-full text-left text-sm text-navy">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-muted border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Asset</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {alerts.map(alert => (
                                <tr key={alert._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{alert.message}</td>
                                    <td className="px-6 py-4 text-muted">{alert.assetId?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-muted">{new Date(alert.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-xs tracking-wide">{alert.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {alert.status === 'ACTIVE' && (
                                            <button onClick={() => updateStatus(alert._id, 'ACKNOWLEDGED')} className="text-xs bg-ice text-primary border border-iceDark font-semibold px-3 py-1.5 rounded hover:bg-iceDark transition-colors">
                                                Acknowledge
                                            </button>
                                        )}
                                        {alert.status !== 'RESOLVED' && (
                                            <button onClick={() => updateStatus(alert._id, 'RESOLVED')} className="text-xs bg-success/10 text-success border border-success/20 font-semibold px-3 py-1.5 rounded hover:bg-success/20 transition-colors">
                                                Resolve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {alerts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-muted bg-gray-50/50">No alerts found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
""")

# 5. Telemetry Page
with open("frontend/src/pages/Telemetry.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import TelemetryChart from '../components/TelemetryChart';

export default function Telemetry() {
    const { selectedStation } = useStation();
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState('');
    const [range, setRange] = useState('24h');
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (selectedStation) {
            fetchAssets();
        }
    }, [selectedStation]);

    const fetchAssets = async () => {
        try {
            const res = await client.get(`/stations/${selectedStation._id}/assets`);
            setAssets(res.data.data);
            if (res.data.data.length > 0) {
                setSelectedAsset(res.data.data[0]._id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedAsset) {
            fetchTelemetry();
        }
    }, [selectedAsset, range]);

    const fetchTelemetry = async () => {
        setLoading(true);
        setError(null);
        try {
            const limitMap = { '1h': 1, '6h': 6, '12h': 12, '24h': 24 };
            const limit = limitMap[range] || 24;
            const res = await client.get(`/telemetry/${selectedAsset}?limit=${limit}`);
            const formatted = res.data.data.map(t => ({
                time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                temp: t.temperature || 0,
                power: t.powerOutput || 0,
                vibration: t.vibration || 0,
                load: t.generatorLoad || 0,
                fuel: t.fuelLevel || 0
            }));
            setTelemetry(formatted);
        } catch (err) {
            console.error(err);
            setError('Unable to load telemetry data');
        } finally {
            setLoading(false);
        }
    };

    if (!selectedStation) return <div className="text-muted">Loading station context...</div>;

    const currentAsset = assets.find(a => a._id === selectedAsset);
    const isGenerator = currentAsset?.type.includes('Generator');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-navy tracking-tight">Telemetry Viewer</h1>
            </div>

            <div className="flex space-x-4 bg-white p-4 rounded-xl border border-border shadow-sm items-center">
                <div className="flex items-center">
                    <span className="text-sm font-bold text-muted uppercase mr-3">Asset:</span>
                    <select 
                        className="bg-gray-50 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary text-navy"
                        value={selectedAsset}
                        onChange={e => setSelectedAsset(e.target.value)}
                    >
                        {assets.map(a => (
                            <option key={a._id} value={a._id}>{a.name} ({a.assetId})</option>
                        ))}
                    </select>
                </div>
                
                <div className="h-6 w-px bg-border mx-2"></div>

                <div className="flex items-center">
                    <span className="text-sm font-bold text-muted uppercase mr-3">Time Range:</span>
                    <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg border border-border">
                        {['1h', '6h', '12h', '24h'].map(r => (
                            <button 
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${range === r ? 'bg-white shadow-sm border border-border text-primary' : 'text-muted hover:text-navy'}`}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-10 text-muted">Loading telemetry...</div>
            ) : error ? (
                <div className="text-center p-10 text-danger bg-danger/5 rounded-xl border border-danger/20">{error}</div>
            ) : telemetry.length === 0 ? (
                <div className="text-center p-10 text-muted bg-white rounded-xl border border-dashed border-gray-300">No telemetry available for the selected range.</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isGenerator ? (
                        <>
                            <div className="h-80"><TelemetryChart data={telemetry} title="Power Output" dataKey="power" color="#2563EB" unit="kW" /></div>
                            <div className="h-80"><TelemetryChart data={telemetry} title="Vibration" dataKey="vibration" color="#38BDF8" unit="mm/s" /></div>
                            <div className="h-80"><TelemetryChart data={telemetry} title="Generator Load" dataKey="load" color="#F59E0B" unit="%" /></div>
                            <div className="h-80"><TelemetryChart data={telemetry} title="Fuel Level" dataKey="fuel" color="#16A34A" unit="%" /></div>
                        </>
                    ) : (
                        <div className="h-80 col-span-full"><TelemetryChart data={telemetry} title="Temperature" dataKey="temp" color="#DC2626" unit="°C" /></div>
                    )}
                </div>
            )}
        </div>
    );
}
""")

# 6. Digital Twin
with open("frontend/src/pages/DigitalTwin.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import AssetDetailPanel from '../components/AssetDetailPanel';

export default function DigitalTwin() {
    const { selectedStation } = useStation();
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [loading, setLoading] = useState(true);

    // Live simulation ticker
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (selectedStation) {
            fetchAssets();
        }
    }, [selectedStation]);

    // Live simulation loop
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
            // In a real app, we might poll the API here.
            // For Phase 3 MVP, we just increment tick to show 'LIVE' feel.
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await client.get(`/stations/${selectedStation._id}/assets`);
            setAssets(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'NORMAL': return 'bg-success shadow-[0_0_15px_rgba(22,163,74,0.5)]';
            case 'WARNING': return 'bg-warning shadow-[0_0_15px_rgba(245,158,11,0.5)]';
            case 'CRITICAL': return 'bg-danger shadow-[0_0_15px_rgba(220,38,38,0.5)]';
            default: return 'bg-muted';
        }
    };

    if (!selectedStation) return <div className="text-muted">Loading station context...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-navy tracking-tight">Station Digital Twin</h1>
                    <p className="text-muted text-sm font-medium mt-1">2D Operational View</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Live Sync</span>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted">Initializing Digital Twin...</div>
            ) : (
                <div className="flex-1 bg-ice rounded-2xl border border-border relative overflow-hidden flex items-center justify-center shadow-inner">
                    {/* Abstract Blueprint Grid Background */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#2563EB 1px, transparent 1px), linear-gradient(90deg, #2563EB 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    
                    {/* The "Station Building" */}
                    <div className="relative w-[800px] h-[500px] bg-white rounded-lg border-2 border-primary/20 shadow-lg p-8 grid grid-cols-3 gap-6">
                        
                        <div className="absolute -top-4 left-8 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
                            {selectedStation.name} Facility
                        </div>

                        {/* Map assets to sections in the building */}
                        {assets.map((asset, i) => (
                            <div 
                                key={asset._id}
                                onClick={() => setSelectedAsset(asset)}
                                className="bg-gray-50 border-2 border-border rounded-xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all group relative flex flex-col justify-between"
                            >
                                <div className="absolute -top-2 -right-2">
                                    <div className={`w-5 h-5 rounded-full border-2 border-white ${getStatusColor(asset.status)} transition-colors duration-500`}></div>
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-navy text-sm mb-1">{asset.name}</h3>
                                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider">{asset.type}</p>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-dashed border-border flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-primary font-bold">View Data</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
        </div>
    );
}
""")

