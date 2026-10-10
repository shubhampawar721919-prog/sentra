import os

with open("frontend/src/pages/Assets.jsx", "w") as f:
    f.write("""import { useState, useEffect } from 'react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import StatusCard from '../components/StatusCard';
import { Box } from 'lucide-react';

export default function Assets() {
    const { selectedStation } = useStation();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="text-gray-400">Loading assets...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Station Assets</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map(asset => (
                    <div key={asset._id} className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white font-medium">{asset.name}</h3>
                                <p className="text-gray-500 text-xs">{asset.assetId} • {asset.type}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                                asset.status === 'NORMAL' ? 'bg-secondary/20 text-secondary' : 
                                asset.status === 'WARNING' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                            }`}>
                                {asset.status}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-800 text-sm space-y-2 text-gray-400">
                            <div className="flex justify-between">
                                <span>Criticality</span>
                                <span className="text-white">{asset.criticality}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
""")

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

    if (loading) return <div className="text-gray-400">Loading alerts...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">System Alerts</h1>
            <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-900/50 text-xs uppercase border-b border-gray-800">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-300">Severity</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Message</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Asset</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Time</th>
                            <th className="px-6 py-4 font-medium text-gray-300">Status</th>
                            <th className="px-6 py-4 font-medium text-gray-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {alerts.map(alert => (
                            <tr key={alert._id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        alert.severity === 'CRITICAL' ? 'bg-danger/20 text-danger' : 
                                        alert.severity === 'HIGH' ? 'bg-danger/20 text-danger' : 
                                        alert.severity === 'MEDIUM' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
                                    }`}>
                                        {alert.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-white">{alert.message}</td>
                                <td className="px-6 py-4">{alert.assetId?.name || 'Unknown'}</td>
                                <td className="px-6 py-4">{new Date(alert.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4">{alert.status}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {alert.status === 'ACTIVE' && (
                                        <button onClick={() => updateStatus(alert._id, 'ACKNOWLEDGED')} className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded hover:bg-primary/30">
                                            Acknowledge
                                        </button>
                                    )}
                                    {alert.status !== 'RESOLVED' && (
                                        <button onClick={() => updateStatus(alert._id, 'RESOLVED')} className="text-xs bg-secondary/20 text-secondary px-3 py-1.5 rounded hover:bg-secondary/30">
                                            Resolve
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {alerts.length === 0 && (
                    <div className="p-10 text-center text-gray-500">No alerts found.</div>
                )}
            </div>
        </div>
    );
}
""")
