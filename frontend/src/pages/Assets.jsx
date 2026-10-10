import { useState, useEffect } from 'react';
import { Search, Database } from 'lucide-react';
import client from '../api/client';
import { useStation } from '../contexts/StationContext';
import AssetDetailPanel from '../components/AssetDetailPanel';

const STATUS_FILTERS = ['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE'];

const statusStyle = {
  ONLINE:      { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', leftColor: '#16A34A' },
  DEGRADED:    { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', leftColor: '#D97706' },
  OFFLINE:     { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', leftColor: '#DC2626' },
  UNAVAILABLE: { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', leftColor: '#94A3B8' },
  NORMAL:      { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', leftColor: '#16A34A' },
  WARNING:     { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', leftColor: '#D97706' },
  CRITICAL:    { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', leftColor: '#DC2626' },
};

const normalizeOpStatus = (status) => {
  if (status === 'NORMAL') return 'ONLINE';
  if (status === 'WARNING') return 'DEGRADED';
  if (status === 'CRITICAL') return 'OFFLINE';
  return status || 'ONLINE';
};

export default function Assets() {
  const { selectedStation } = useStation();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { if (selectedStation) fetchAssets(); }, [selectedStation]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const [assetsRes, intelRes] = await Promise.all([
        client.get(`/stations/${selectedStation._id}/assets`),
        client.get(`/stations/${selectedStation._id}/intelligence`).catch(() => null)
      ]);
      const intelList = intelRes?.data?.data?.assetsIntelligence || [];
      const intelMap = {};
      intelList.forEach(ai => { intelMap[ai.assetId] = ai; });
      const enrichedAssets = assetsRes.data.data.map(a => ({
        ...a,
        intelligence: intelMap[a.assetId] || null
      }));
      setAssets(enrichedAssets);
    } catch {}
    finally { setLoading(false); }
  };

  const filtered = assets.filter(a => {
    const op = normalizeOpStatus(a.status);
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                        a.assetId.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || op === filter || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#12304A', margin: '0 0 6px' }}>
            Asset Management
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
            {assets.length} assets at {selectedStation?.name}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1', maxWidth: '380px' }}>
          <Search style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            width: '18px', height: '18px', color: '#64748B',
          }} />
          <input
            type="text"
            placeholder="Search assets…"
            style={{
              width: '100%',
              paddingLeft: '44px', paddingRight: '16px',
              paddingTop: '12px', paddingBottom: '12px',
              backgroundColor: '#FFFFFF', border: '1px solid #D8E7F0',
              borderRadius: '10px', fontSize: '15px', color: '#1E3448',
              outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filters */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: '#FFFFFF', border: '1px solid #D8E7F0',
          borderRadius: '10px', padding: '6px',
        }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: filter === f ? '#2563EB' : 'transparent',
                color: filter === f ? '#FFFFFF' : '#64748B',
                fontFamily: 'Inter, sans-serif',
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Asset Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B', fontSize: '15px' }}>
          Loading assets…
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {filtered.map(asset => {
            const opStatus = normalizeOpStatus(asset.status);
            const s = statusStyle[opStatus] || statusStyle.ONLINE;
            return (
              <div
                key={asset._id}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D8E7F0',
                  borderLeft: `4px solid ${s.leftColor}`,
                  borderRadius: '10px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s ease',
                  boxShadow: '0 1px 3px rgba(18,48,74,0.06)',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(18,48,74,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(18,48,74,0.06)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#12304A', margin: '0 0 6px' }}>
                      {asset.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748B', fontFamily: 'monospace', margin: 0, fontWeight: 500 }}>
                      {asset.assetId}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                    color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}`,
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                    {opStatus}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '14px', color: '#64748B', fontWeight: 500,
                    padding: '4px 10px', backgroundColor: '#F6FAFD',
                    border: '1px solid #D8E7F0', borderRadius: '6px',
                  }}>
                    {asset.type}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>
                    {asset.criticality}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              padding: '80px 0', textAlign: 'center',
            }}>
              <Database style={{ width: '40px', height: '40px', color: '#CBD5E1', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '15px', color: '#64748B' }}>No assets found</p>
            </div>
          )}
        </div>
      )}

      {selectedAsset && (
        <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}
