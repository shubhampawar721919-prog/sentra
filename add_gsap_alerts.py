import os

with open("frontend/src/pages/Alerts.jsx", "w") as f:
    f.write("""import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Alerts() {
    const { selectedStation } = useStation();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const container = useRef();

    useGSAP(() => {
        if (!loading && alerts.length > 0) {
            gsap.from('.alert-header', { y: -20, opacity: 0, duration: 0.5, ease: 'power2.out' });
            gsap.from('.alert-row', { 
                x: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 
            });
        }
    }, [loading, alerts]);

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
            case 'CRITICAL': return 'bg-danger text-white border-danger shadow-sm';
            case 'HIGH': return 'bg-danger/10 text-danger border-danger/20';
            case 'MEDIUM': return 'bg-warning/10 text-warning border-warning/30';
            default: return 'bg-success/10 text-success border-success/30';
        }
    };

    if (!selectedStation) return <div className="text-muted">Loading station context...</div>;

    return (
        <div className="space-y-6" ref={container}>
            <h1 className="text-3xl font-bold text-navy tracking-tight alert-header opacity-0">System Alerts</h1>
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden alert-header opacity-0">
                {loading ? (
                    <div className="p-10 text-center text-muted font-medium">Loading alerts...</div>
                ) : (
                    <table className="w-full text-left text-sm text-navy">
                        <thead className="bg-gray-50/80 text-[10px] uppercase font-bold text-muted border-b border-border tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Asset</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {alerts.map(alert => (
                                <tr key={alert._id} className="alert-row opacity-0 hover:bg-ice/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-navy group-hover:text-primary transition-colors">{alert.message}</td>
                                    <td className="px-6 py-4 text-muted font-medium">{alert.assetId?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-muted">{new Date(alert.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-xs tracking-wider text-navyLight">{alert.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {alert.status === 'ACTIVE' && (
                                            <button onClick={() => updateStatus(alert._id, 'ACKNOWLEDGED')} className="text-xs bg-ice text-primary border border-iceDark font-bold px-4 py-2 rounded-lg hover:bg-iceDark hover:shadow-sm transition-all transform hover:-translate-y-0.5">
                                                Acknowledge
                                            </button>
                                        )}
                                        {alert.status !== 'RESOLVED' && (
                                            <button onClick={() => updateStatus(alert._id, 'RESOLVED')} className="text-xs bg-success/10 text-success border border-success/20 font-bold px-4 py-2 rounded-lg hover:bg-success/20 hover:shadow-sm transition-all transform hover:-translate-y-0.5">
                                                Resolve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {alerts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-muted bg-gray-50/50 font-medium">No active alerts found.</td>
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

