import { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Zap, Wind, Battery, Fuel, Activity, Radio, Cpu, AlertTriangle } from 'lucide-react';

// Canonical hierarchical layouts for Antarctic stations
const bharatiLayout = {
  // Tier 0: Fuel Reservoir
  'FUEL-01': { x: 380, y: 30 },

  // Tier 1: Power Generation Complex
  'DG-001': { x: 200, y: 150 },
  'DG-002': { x: 560, y: 150 },

  // Tier 2: Energy Storage & Climate Control
  'BAT-01':  { x: 40,  y: 290 },
  'BAT-02':  { x: 190, y: 290 },
  'HVAC-01': { x: 340, y: 290 },
  'HVAC-02': { x: 490, y: 290 },
  'BAT-03':  { x: 640, y: 290 },
  'HVAC-03': { x: 790, y: 290 },

  // Tier 3: Critical Facilities, Life Support, & Communications
  'PUMP-01': { x: 120, y: 440 },
  'COM-01':  { x: 270, y: 440 },
  'PUMP-02': { x: 710, y: 440 },
};

const maitriLayout = {
  // Tier 0: Fuel Supply
  'MTR-FUEL-01': { x: 300, y: 30 },

  // Tier 1: Generators
  'MTR-DG-01': { x: 160, y: 150 },
  'MTR-DG-02': { x: 440, y: 150 },

  // Tier 2: Storage & Environmental
  'MTR-BAT-01':  { x: 160, y: 280 },
  'MTR-HVAC-01': { x: 320, y: 280 },
  'MTR-PUMP-01': { x: 480, y: 280 },

  // Tier 3: Meteorology
  'MTR-ENV-01':  { x: 320, y: 410 },
};

const maitri2Layout = {
  // Tier 0: Power Generation
  'M2-WIND-01': { x: 200, y: 30 },
  'M2-SOLAR-01': { x: 400, y: 30 },
  'M2-H2-01': { x: 600, y: 30 },
  
  // Tier 1: Energy Storage
  'M2-BESS-01': { x: 400, y: 150 },

  // Tier 2: Distribution
  'M2-HVAC-01': { x: 250, y: 280 },
  'M2-PUMP-01': { x: 400, y: 280 },
  'M2-COM-01': { x: 550, y: 280 },
  
  // Tier 3: Consumers (Weather)
  'M2-AWS-01': { x: 400, y: 410 },
  'M2-HAB-01': { x: 250, y: 410 },
  'M2-LAB-01': { x: 550, y: 410 }
};

const getRiskColor = (level) => {
  if (level === 'CRITICAL') return '#DC2626';
  if (level === 'HIGH') return '#EA580C';
  if (level === 'MEDIUM') return '#D97706';
  return '#16A34A';
};

const getRiskBg = (level) => {
  if (level === 'CRITICAL') return '#FEF2F2';
  if (level === 'HIGH') return '#FFF7ED';
  if (level === 'MEDIUM') return '#FFFBEB';
  return '#F0FDF4';
};

const getAssetIcon = (type = '', id = '') => {
  const t = (type + ' ' + id).toLowerCase();
  if (t.includes('fuel')) return Fuel;
  if (t.includes('generator') || t.includes('dg')) return Zap;
  if (t.includes('battery') || t.includes('bat')) return Battery;
  if (t.includes('hvac')) return Wind;
  if (t.includes('pump')) return Activity;
  if (t.includes('com')) return Radio;
  return Cpu;
};

export default function TopologyGraph({
  assets = [],
  intelligence = {},
  dependencies = null,
  selectedAssetId = null,
  onSelectAsset = () => {}
}) {
  const isMaitri = assets.some(a => a.assetId?.startsWith('MTR'));
  const isMaitri2 = assets.some(a => a.assetId?.startsWith('M2-'));
  const layoutMap = isMaitri2 ? maitri2Layout : (isMaitri ? maitriLayout : bharatiLayout);

  // Build Flow Nodes
  const nodes = useMemo(() => {
    return assets.map((asset, index) => {
      const id = asset.assetId;
      const ai = intelligence[id] || {};
      const riskLevel = ai.risk?.level || (asset.status === 'CRITICAL' ? 'CRITICAL' : asset.status === 'WARNING' ? 'HIGH' : 'LOW');
      const isSelected = selectedAssetId === id;
      const Icon = getAssetIcon(asset.type, id);

      const pos = layoutMap[id] || {
        x: 100 + (index % 4) * 180,
        y: 100 + Math.floor(index / 4) * 130
      };

      const isThreatRoot = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';

      return {
        id,
        position: pos,
        data: {
          label: (
            <div
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={14} color={getRiskColor(riskLevel)} />
                  <span style={{ fontWeight: 800, fontSize: '12px', color: '#1E3448' }}>{id}</span>
                </div>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: getRiskBg(riskLevel),
                  color: getRiskColor(riskLevel),
                  border: `1px solid ${getRiskColor(riskLevel)}40`
                }}>
                  {riskLevel}
                </span>
              </div>

              <div style={{
                fontSize: '11px',
                color: '#64748B',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '120px'
              }}>
                {asset.name}
              </div>

              {isThreatRoot && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  marginTop: '2px', fontSize: '10px', color: '#DC2626', fontWeight: 700
                }}>
                  <AlertTriangle size={11} />
                  <span>Degraded Telemetry</span>
                </div>
              )}
            </div>
          )
        },
        style: {
          border: isSelected
            ? '2px solid #2563EB'
            : isThreatRoot
            ? '2px solid #DC2626'
            : `1.5px solid ${getRiskColor(riskLevel)}80`,
          borderRadius: '10px',
          backgroundColor: '#FFFFFF',
          width: 155,
          boxShadow: isSelected
            ? '0 0 0 3px rgba(37,99,235,0.25), 0 4px 12px rgba(0,0,0,0.08)'
            : isThreatRoot
            ? '0 0 12px rgba(220,38,38,0.35)'
            : '0 2px 8px rgba(18,48,74,0.06)',
          transition: 'all 0.2s ease'
        }
      };
    });
  }, [assets, intelligence, layoutMap, selectedAssetId, onSelectAsset]);

  // Build Flow Edges
  const edges = useMemo(() => {
    const edgeList = [];
    const adjList = dependencies?.adjacencyList || (isMaitri2 ? {
      "M2-WIND-01": ["M2-BESS-01"],
      "M2-SOLAR-01": ["M2-BESS-01"],
      "M2-H2-01": ["M2-BESS-01"],
      "M2-BESS-01": ["M2-HVAC-01", "M2-PUMP-01", "M2-COM-01", "M2-LAB-01"],
      "M2-HVAC-01": ["M2-HAB-01"],
      "M2-PUMP-01": ["M2-HAB-01", "M2-LAB-01"]
    } : isMaitri ? {
      "MTR-FUEL-01": ["MTR-DG-01", "MTR-DG-02"],
      "MTR-DG-01": ["MTR-BAT-01", "MTR-HVAC-01", "MTR-PUMP-01"],
      "MTR-DG-02": ["MTR-BAT-01", "MTR-HVAC-01"],
      "MTR-BAT-01": ["MTR-HVAC-01"],
    } : {
      "FUEL-01": ["DG-001", "DG-002"],
      "DG-001": ["BAT-01", "BAT-02", "HVAC-01", "HVAC-02", "PUMP-01", "COM-01"],
      "DG-002": ["BAT-02", "HVAC-03", "PUMP-02"],
      "BAT-01": ["COM-01"],
      "BAT-02": ["HVAC-02"],
      "PUMP-01": ["DG-001"],
    });

    Object.entries(adjList).forEach(([parent, children]) => {
      children.forEach(child => {
        const parentIntel = intelligence[parent];
        const isParentThreat = parentIntel?.risk?.level === 'CRITICAL' || parentIntel?.risk?.level === 'HIGH';
        const isChildThreat = intelligence[child]?.risk?.level === 'CRITICAL' || intelligence[child]?.risk?.level === 'HIGH';
        const isCascading = isParentThreat;

        edgeList.push({
          id: `e-${parent}->${child}`,
          source: parent,
          target: child,
          animated: isCascading,
          style: {
            stroke: isCascading ? '#DC2626' : isChildThreat ? '#EA580C' : '#94A3B8',
            strokeWidth: isCascading ? 2.5 : 1.5,
            strokeDasharray: isCascading ? '5,5' : 'none'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCascading ? '#DC2626' : isChildThreat ? '#EA580C' : '#94A3B8',
            width: 14,
            height: 14
          }
        });
      });
    });

    return edgeList;
  }, [dependencies, intelligence, isMaitri, isMaitri2]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '620px', position: 'relative', backgroundColor: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
      
      {/* Graph Legend Overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(6px)',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '11px',
        color: '#475569'
      }}>
        <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#1E3448', letterSpacing: '0.05em', marginBottom: '2px' }}>
          Cascade Topology
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
          <span>Nominal (Low Risk)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
          <span>Threat Root (Degraded)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '16px', height: '2px', backgroundColor: '#DC2626', borderTop: '2px dashed #DC2626' }} />
          <span>Active Cascade Link</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.5}
        maxZoom={1.5}
        onNodeClick={(event, node) => {
          const clickedAsset = assets.find(a => a.assetId === node.id);
          if (clickedAsset) onSelectAsset(clickedAsset);
        }}
      >
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const id = node.id;
            const r = intelligence[id]?.risk?.level;
            return getRiskColor(r);
          }}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px'
          }}
        />
        <Background color="#CBD5E1" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
