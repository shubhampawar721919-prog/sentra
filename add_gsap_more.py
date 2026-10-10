import os

# 1. Assets.jsx
with open("frontend/src/pages/Assets.jsx", "w") as f:
    f.write("""import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import AssetDetailPanel from '../components/AssetDetailPanel';
import { Search, Filter } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Assets() {
    const { selectedStation } = useStation();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [search, setSearch] = useState('');
    const container = useRef();

    useGSAP(() => {
        if (!loading && assets.length > 0) {
            gsap.from('.asset-header', { y: -20, opacity: 0, duration: 0.5, ease: 'power2.out' });
            gsap.from('.asset-card', { 
                y: 30, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(1.2)', delay: 0.2 
            });
        }
    }, [loading, assets]);

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
        <div className="space-y-6" ref={container}>
            <div className="flex justify-between items-center asset-header opacity-0">
                <h1 className="text-3xl font-bold text-navy tracking-tight">Asset Management</h1>
            </div>

            <div className="flex space-x-4 bg-white p-4 rounded-xl border border-border shadow-sm asset-header opacity-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-muted w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="Search assets..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-navy transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className="flex items-center px-4 py-2 border border-border rounded-lg bg-gray-50 text-navy font-medium hover:bg-gray-100 hover:text-primary transition-colors">
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
                            className="asset-card opacity-0 bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer flex flex-col group transform hover:-translate-y-1"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-navy font-bold text-lg group-hover:text-primary transition-colors">{asset.name}</h3>
                                    <p className="text-muted text-xs mt-1 font-semibold tracking-wider uppercase">{asset.assetId} • {asset.type}</p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${getStatusColor(asset.status)}`}>
                                    {asset.status}
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                                <span className="text-xs uppercase text-muted font-bold tracking-wider">Criticality</span>
                                <span className="text-sm font-extrabold text-navy">{asset.criticality}</span>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="col-span-full p-10 text-center text-muted bg-white rounded-xl border border-dashed border-gray-300">No assets found.</div>}
                </div>
            )}

            {selectedAsset && <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
        </div>
    );
}
""")

# 2. Telemetry.jsx
with open("frontend/src/pages/Telemetry.jsx", "w") as f:
    f.write("""import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import TelemetryChart from '../components/TelemetryChart';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Telemetry() {
    const { selectedStation } = useStation();
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState('');
    const [range, setRange] = useState('24h');
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const container = useRef();

    useGSAP(() => {
        if (!loading && telemetry.length > 0) {
            gsap.from('.tel-header', { y: -20, opacity: 0, duration: 0.5, ease: 'power2.out' });
            gsap.from('.tel-chart', { y: 30, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out', delay: 0.2 });
        }
    }, [loading, telemetry, selectedAsset]);

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
        <div className="space-y-6" ref={container}>
            <div className="flex justify-between items-center tel-header opacity-0">
                <h1 className="text-3xl font-bold text-navy tracking-tight">Telemetry Viewer</h1>
            </div>

            <div className="flex space-x-4 bg-white p-4 rounded-xl border border-border shadow-sm items-center tel-header opacity-0">
                <div className="flex items-center">
                    <span className="text-sm font-bold text-muted uppercase mr-3">Asset:</span>
                    <select 
                        className="bg-gray-50 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary text-navy cursor-pointer hover:border-gray-300 transition-colors"
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
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${range === r ? 'bg-white shadow-sm border border-border text-primary scale-105' : 'text-muted hover:text-navy hover:bg-gray-200/50'}`}
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
                <div className="text-center p-10 text-danger bg-danger/5 rounded-xl border border-danger/20 font-medium">{error}</div>
            ) : telemetry.length === 0 ? (
                <div className="text-center p-10 text-muted bg-white rounded-xl border border-dashed border-gray-300">No telemetry available for the selected range.</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isGenerator ? (
                        <>
                            <div className="h-80 tel-chart opacity-0"><TelemetryChart data={telemetry} title="Power Output" dataKey="power" color="#2563EB" unit="kW" /></div>
                            <div className="h-80 tel-chart opacity-0"><TelemetryChart data={telemetry} title="Vibration" dataKey="vibration" color="#38BDF8" unit="mm/s" /></div>
                            <div className="h-80 tel-chart opacity-0"><TelemetryChart data={telemetry} title="Generator Load" dataKey="load" color="#F59E0B" unit="%" /></div>
                            <div className="h-80 tel-chart opacity-0"><TelemetryChart data={telemetry} title="Fuel Level" dataKey="fuel" color="#16A34A" unit="%" /></div>
                        </>
                    ) : (
                        <div className="h-80 col-span-full tel-chart opacity-0"><TelemetryChart data={telemetry} title="Temperature" dataKey="temp" color="#DC2626" unit="°C" /></div>
                    )}
                </div>
            )}
        </div>
    );
}
""")

