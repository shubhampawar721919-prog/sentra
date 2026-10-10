import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import { socket } from '../App';
import AssetDetailPanel from '../components/AssetDetailPanel';
import TopologyGraph from '../components/TopologyGraph';
import AnomalyTriggerModal from '../components/AnomalyTriggerModal';
import {
  Zap, Battery, Wind, Fuel, Activity, Radio, Home, CloudRain,
  ShieldAlert, AlertTriangle, RefreshCw,
  Compass, ArrowRight, Layers, Sliders, ChevronRight,
  Cpu, Thermometer, GitFork, Package, Anchor, Boxes, Clock, Search
} from 'lucide-react';

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D8E7F0',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(18,48,74,0.04)',
};

const riskColors = {
  CRITICAL: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  HIGH:     { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  MEDIUM:   { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  LOW:      { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
};

const opStatusColors = {
  ONLINE:      { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A' },
  DEGRADED:    { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' },
  OFFLINE:     { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626' },
  UNAVAILABLE: { text: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8' },
};

export default function DigitalTwin() {
  const navigate = useNavigate();
  const { selectedStation, stations, setSelectedStation } = useStation();

  const [assets, setAssets] = useState([]);
  const [stationIntel, setStationIntel] = useState(null);
  const [dependencies, setDependencies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction State
  const [selectedAssetId, setSelectedAssetId] = useState('DG-001');
  const [detailPanelAsset, setDetailPanelAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('schematic'); // 'schematic' | 'energy' | 'fuel' | 'environment'
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [sparesCategory, setSparesCategory] = useState('ALL');
  const [sparesSearch, setSparesSearch] = useState('');

  // Simulation Overlay Mode (Part N, O)
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationScenario, setSimulationScenario] = useState('DG_FAILURE'); // 'DG_FAILURE' | 'LOAD_SURGE'
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);

  useEffect(() => {
    if (selectedStation) {
      loadStationData();
    }
  }, [selectedStation]);

  // Live Socket.IO Updates (Part J)
  useEffect(() => {
    const handleAlertEvent = () => {
      if (selectedStation) {
        loadStationData(true);
      }
    };

    socket.on('alert:created', handleAlertEvent);
    socket.on('alert:updated', handleAlertEvent);
    socket.on('alert:resolved', handleAlertEvent);

    return () => {
      socket.off('alert:created', handleAlertEvent);
      socket.off('alert:updated', handleAlertEvent);
      socket.off('alert:resolved', handleAlertEvent);
    };
  }, [selectedStation]);

  const loadStationData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [assetsRes, intelRes, depRes] = await Promise.all([
        client.get(`/stations/${selectedStation._id}/assets?_t=${Date.now()}`),
        client.get(`/stations/${selectedStation._id}/intelligence?_t=${Date.now()}`),
        client.get(`/stations/${selectedStation._id}/dependencies?_t=${Date.now()}`)
      ]);

      const assetList = assetsRes.data.data || [];
      setAssets(assetList);
      setStationIntel(intelRes.data.data);
      setDependencies(depRes.data.data);

      // Default selected asset if current selection is invalid for station
      if (assetList.length > 0) {
        const found = assetList.find(a => a.assetId === selectedAssetId);
        if (!found) {
          const defaultAsset = assetList.find(a => a.assetId.includes('DG')) || assetList[0];
          setSelectedAssetId(defaultAsset.assetId);
        }
      }
    } catch (err) {
      console.error("Digital Twin load error:", err);
      setError("Unable to load Antarctic Station Digital Twin.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Map asset intelligence by assetId
  const intelMap = useMemo(() => {
    const map = {};
    if (stationIntel?.assetsIntelligence) {
      stationIntel.assetsIntelligence.forEach(ai => {
        map[ai.assetId] = ai;
      });
    }
    return map;
  }, [stationIntel]);

  // Calculate dependency chain for currently selected asset
  const selectedChain = useMemo(() => {
    if (!dependencies?.adjacencyList || !selectedAssetId) {
      return { direct: [], secondary: [] };
    }
    const direct = dependencies.adjacencyList[selectedAssetId] || [];
    const secondary = new Set();
    direct.forEach(child => {
      const gChildren = dependencies.adjacencyList[child] || [];
      gChildren.forEach(gc => {
        if (gc !== selectedAssetId && !direct.includes(gc)) {
          secondary.add(gc);
        }
      });
    });
    return { direct, secondary: Array.from(secondary) };
  }, [dependencies, selectedAssetId]);

  // Group assets into the 8 Logical Zones dynamically (Part E, F)
  const zoneBuckets = useMemo(() => {
    const buckets = {
      POWER_GENERATION: { name: 'Power Generation Complex', icon: Zap, assets: [] },
      ENERGY_STORAGE: { name: 'Energy Storage & Batteries', icon: Battery, assets: [] },
      CLIMATE_CONTROL: { name: 'HVAC & Climate Control', icon: Wind, assets: [] },
      FUEL_STORAGE: { name: 'Fuel Systems & Storage', icon: Fuel, assets: [] },
      CRITICAL_FACILITIES: { name: 'Coolant & Life Support Pumps', icon: Activity, assets: [] },
      COMMUNICATIONS: { name: 'Satellite Uplink & Comms', icon: Radio, assets: [] },
      HABITATION: { name: 'Crew Living Quarters', icon: Home, assets: [] },
      METEOROLOGY: { name: 'Meteorological & AWS Sensor', icon: CloudRain, assets: [] },
    };

    assets.forEach(asset => {
      const ai = intelMap[asset.assetId];
      const risk = ai?.risk?.level || 'LOW';
      if (filterRisk !== 'ALL') {
        if (filterRisk === 'HIGH_CRITICAL' && risk !== 'HIGH' && risk !== 'CRITICAL') return;
        if (filterRisk === 'MEDIUM' && risk !== 'MEDIUM') return;
        if (filterRisk === 'LOW' && risk !== 'LOW') return;
      }

      const zoneId = dependencies?.assetZoneMap?.[asset.assetId] || 'CRITICAL_FACILITIES';
      if (buckets[zoneId]) {
        buckets[zoneId].assets.push(asset);
      } else {
        buckets.CRITICAL_FACILITIES.assets.push(asset);
      }
    });

    return buckets;
  }, [assets, dependencies, filterRisk, intelMap]);

  // Simulated metrics when in What-If mode (Parts N, O)
  const simulatedStationState = useMemo(() => {
    if (!stationIntel || !isSimulationMode) return null;

    const isMtr = selectedStation?.code === 'MTR';
    const baseResilience = stationIntel.resilienceScore ?? (isMtr ? 94 : 47);
    const baseMargin = stationIntel.energy?.energyMargin ?? (isMtr ? 82 : 66);
    const baseFuel = stationIntel.fuel?.remainingRuntimeDays ?? (isMtr ? 24.7 : 19.2);

    if (simulationScenario === 'DG_FAILURE') {
      return {
        resilience: Math.max(10, baseResilience - 35),
        resilienceDelta: -35,
        energyMargin: baseMargin - 425, // Deficit
        marginDelta: -425,
        fuelDays: Number((baseFuel + 3.2).toFixed(1)), // Less generation burning fuel
        status: 'CRITICAL',
        threatNote: `Critical in-service failure of ${selectedAssetId}; total loss of primary power bus.`
      };
    } else {
      // LOAD_SURGE
      return {
        resilience: Math.max(15, baseResilience - 22),
        resilienceDelta: -22,
        energyMargin: Math.max(-120, baseMargin - 150),
        marginDelta: -150,
        fuelDays: Number((baseFuel - 4.1).toFixed(1)),
        status: 'VULNERABLE',
        threatNote: 'Thermal heating surge caused by -45°C polar blizzard overload.'
      };
    }
  }, [stationIntel, isSimulationMode, simulationScenario, selectedAssetId, selectedStation]);

  // Determine an asset's visual state (Live vs Simulation, and Dependency role)
  const getAssetVisualState = (asset) => {
    const ai = intelMap[asset.assetId];
    const rawRisk = ai?.risk?.level || 'LOW';
    let risk = rawRisk;

    let opStatus = 'ONLINE';
    if (asset.status === 'WARNING') opStatus = 'DEGRADED';
    if (asset.status === 'CRITICAL') opStatus = 'OFFLINE';

    // In simulation mode, simulate degradation on selected asset and dependents
    if (isSimulationMode) {
      if (asset.assetId === selectedAssetId) {
        opStatus = 'OFFLINE';
        risk = 'CRITICAL';
      } else if (selectedChain.direct.includes(asset.assetId)) {
        opStatus = 'DEGRADED';
        risk = 'HIGH';
      } else if (selectedChain.secondary.includes(asset.assetId)) {
        risk = 'MEDIUM';
      }
    }

    // Cascade Dependency Role
    let cascadeRole = 'NORMAL';
    if (selectedAssetId) {
      if (asset.assetId === selectedAssetId) {
        cascadeRole = (risk === 'CRITICAL' || risk === 'HIGH') ? 'ROOT_RISK' : 'SELECTED';
      } else if (selectedChain.direct.includes(asset.assetId)) {
        cascadeRole = 'DIRECT_IMPACT';
      } else if (selectedChain.secondary.includes(asset.assetId)) {
        cascadeRole = 'SECONDARY_IMPACT';
      } else {
        cascadeRole = 'UNAFFECTED';
      }
    }

    return {
      opStatus,
      risk,
      cascadeRole,
      telemetry: ai?.telemetry || {},
      anomaly: ai?.anomaly || { score: 0, detected: false },
      failureProb: ai?.failurePrediction?.probability || 0,
      decision: ai?.decision || null,
    };
  };

  const selectedAssetDoc = assets.find(a => a.assetId === selectedAssetId);
  const selectedVisualState = selectedAssetDoc ? getAssetVisualState(selectedAssetDoc) : null;

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#64748B', fontSize: '15px' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: '#2563EB' }} />
        Initializing Antarctic Operational Digital Twin & telemetry graph…
      </div>
    );
  }

  if (error || !stationIntel) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#DC2626' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
        <h3>Station Data Unavailable</h3>
        <p style={{ color: '#64748B' }}>{error || 'Cannot communicate with station telemetry services.'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>

      {/* 1. STATION STATE HEADER (Part K) */}
      <div style={{ ...cardStyle, padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Station Title & Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 800, color: '#2563EB', backgroundColor: '#EFF6FF',
                  padding: '3px 8px', borderRadius: '4px', border: '1px solid #BFDBFE'
                }}>
                  OPERATIONAL DIGITAL TWIN
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  {selectedStation.code} BASELINE
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#12304A', margin: '4px 0 0' }}>
                {selectedStation.name} Research Station
              </h1>
            </div>

            {/* Station Selector Dropdown */}
            <select
              value={selectedStation._id}
              onChange={(e) => {
                const s = stations.find(st => st._id === e.target.value);
                if (s) setSelectedStation(s);
              }}
              style={{
                fontSize: '13px', fontWeight: 600, padding: '8px 12px',
                borderRadius: '8px', border: '1px solid #D8E7F0', backgroundColor: '#F8FAFC',
                color: '#1E3448', outline: 'none', cursor: 'pointer'
              }}
            >
              {stations.map(st => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.code}) — {st.environment || 'Antarctica'}
                </option>
              ))}
            </select>
          </div>

          {/* KPI Pills Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Resilience Score */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px',
              backgroundColor: isSimulationMode ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${isSimulationMode ? '#FECACA' : '#BBF7D0'}`
            }}>
              <ShieldAlert size={16} color={isSimulationMode ? '#DC2626' : '#16A34A'} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>RESILIENCE</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: isSimulationMode ? '#DC2626' : '#16A34A' }}>
                  {isSimulationMode ? simulatedStationState.resilience : stationIntel.resilienceScore} / 100
                </div>
              </div>
            </div>

            {/* Operational Status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: (stationIntel.operationalStatus === 'ONLINE' ? '#16A34A' : stationIntel.operationalStatus === 'DEGRADED' ? '#D97706' : '#DC2626')
              }} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>STATUS</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3448' }}>
                  {isSimulationMode ? 'DEGRADED' : (stationIntel.operationalStatus || 'ONLINE')}
                </div>
              </div>
            </div>

            {/* Environment */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0'
            }}>
              <Thermometer size={16} color="#0284C7" />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>ENVIRONMENT</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3448' }}>
                  {stationIntel.environmental?.temperature || -30.2}°C ({stationIntel.environmental?.condition || 'SEVERE COLD'})
                </div>
              </div>
            </div>

            {/* Energy Margin */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0'
            }}>
              <Zap size={16} color="#2563EB" />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>ENERGY MARGIN</div>
                <div style={{
                  fontSize: '13px', fontWeight: 800,
                  color: (isSimulationMode ? simulatedStationState.energyMargin : stationIntel.energy?.energyMargin) < 0 ? '#DC2626' : '#1E3448'
                }}>
                  {isSimulationMode ? simulatedStationState.energyMargin : stationIntel.energy?.energyMargin} kW
                </div>
              </div>
            </div>

            {/* Fuel Runway */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0'
            }}>
              <Fuel size={16} color="#D97706" />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>FUEL RUNWAY</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E3448' }}>
                  {stationIntel.fuel?.remainingRuntimeDays || 19.2} Days
                </div>
              </div>
            </div>

            {/* Live Sync Pulse */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#16A34A',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#16A34A' }}>LIVE SYNC</span>
            </div>

          </div>
        </div>

        {/* Action Controls & Overlay Switcher */}
        <div style={{
          marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #EDF2F7',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
        }}>
          {/* Overlay Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
            {[
              { id: 'schematic', label: '2D Schematic', icon: Layers },
              { id: 'topology', label: 'Dependency Graph', icon: GitFork },
              { id: 'energy', label: 'Energy Flow', icon: Zap },
              { id: 'fuel', label: 'Fuel Flow', icon: Fuel },
              { id: 'environment', label: 'Weather Stress', icon: CloudRain },
              { id: 'logistics', label: 'Logistics & Spares', icon: Package }
            ].map(tab => {
              const Icon = tab.icon;
              const isAct = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '6px', border: 'none',
                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    backgroundColor: isAct ? '#FFFFFF' : 'transparent',
                    color: isAct ? '#2563EB' : '#64748B',
                    boxShadow: isAct ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Risk Filter (Part T) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Risk Filter:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              style={{
                fontSize: '12px', fontWeight: 600, padding: '6px 10px',
                borderRadius: '6px', border: '1px solid #D8E7F0', backgroundColor: '#FFFFFF',
                color: '#1E3448', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH_CRITICAL">Critical & High</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          {/* What-If & Reset Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Live Fault Injection Shortcut */}
            <button
              onClick={() => setIsAnomalyModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 12px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700,
                backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A'
              }}
              title="Open Live Fault Injection & Anomaly Testing Console"
            >
              <Zap size={14} color="#D97706" />
              Fault Simulator
            </button>

            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '5px 9px', borderRadius: '6px',
              backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0',
              letterSpacing: '0.03em'
            }}>
              SIMULATION — NO DATABASE CHANGES
            </span>
            <button
              onClick={() => setIsSimulationMode(!isSimulationMode)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700,
                backgroundColor: isSimulationMode ? '#DC2626' : '#2563EB',
                color: '#FFFFFF', border: 'none'
              }}
            >
              <Sliders size={15} />
              {isSimulationMode ? 'Exit What-If Mode' : 'Run What-If Simulation'}
            </button>

            {selectedAssetId && (
              <button
                onClick={() => setSelectedAssetId(null)}
                style={{
                  fontSize: '12px', fontWeight: 600, padding: '7px 12px',
                  borderRadius: '8px', border: '1px solid #D8E7F0', backgroundColor: '#FFFFFF',
                  color: '#64748B', cursor: 'pointer'
                }}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SIMULATION OVERLAY BANNER (Parts N, O) */}
      {isSimulationMode && (
        <div style={{
          backgroundColor: '#FFFBEB', border: '2px solid #FDE68A',
          borderRadius: '12px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#D97706" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', letterSpacing: '0.04em' }}>
                SIMULATION ACTIVE — NO DATABASE CHANGES
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', color: '#78350F' }}>
                Simulating consequences of <strong>{selectedAssetId}</strong>
              </span>
              <select
                value={simulationScenario}
                onChange={(e) => setSimulationScenario(e.target.value)}
                style={{
                  fontSize: '12px', fontWeight: 600, padding: '4px 8px',
                  borderRadius: '6px', border: '1px solid #FDE68A', backgroundColor: '#FFFFFF',
                  color: '#78350F', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="DG_FAILURE">Scenario: Primary Generator Trip</option>
                <option value="LOAD_SURGE">Scenario: Severe Polar Blizzard (+39% Surge)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', fontSize: '12px' }}>
              <div style={{ color: '#78350F' }}>Projected Resilience</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>
                {simulatedStationState.resilience} / 100 ({simulatedStationState.resilienceDelta} pts)
              </div>
            </div>

            <button
              onClick={() => navigate(`/decision-center?alertId=${stationIntel?.activeAlerts?.[0]?._id || ''}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Compass size={16} /> Compare Responses in Decision Center
            </button>
          </div>
        </div>
      )}

      {/* 3. MACRO SYSTEM FLOW OVERVIEW (Part L) */}
      <div style={{ ...cardStyle, padding: '16px 20px', backgroundColor: '#F8FAFC' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
          ANTARCTIC STATION MACRO INTERDEPENDENCE FLOW
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
          {[
            { label: 'ENVIRONMENT', val: `${stationIntel.environmental?.temperature || -30.2}°C`, sub: stationIntel.environmental?.condition || 'SEVERE COLD', icon: CloudRain, color: '#0284C7' },
            { label: 'THERMAL BURDEN', val: `+${stationIntel.environmental?.heatingDeltaPercent || 39}%`, sub: 'Extra heating load', icon: Thermometer, color: '#D97706' },
            { label: 'GENERATION', val: `${stationIntel.energy?.currentGeneration || 480} kW`, sub: 'Primary Grid supply', icon: Zap, color: '#2563EB' },
            { label: 'ENERGY STORAGE', val: 'Alpha / Beta', sub: 'UPS Float & Redundancy', icon: Battery, color: '#16A34A' },
            { label: 'LIFE SUPPORT', val: 'Active', sub: 'Habitation, Chillers, Pumps', icon: Activity, color: '#DC2626' },
            { label: 'FUEL RUNWAY', val: `${stationIntel.fuel?.remainingRuntimeDays || 19.2} Days`, sub: `${stationIntel.fuel?.consumptionRatePercentPerDay || 3.8}%/day burn`, icon: Fuel, color: '#7C3AED' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} style={{
                backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={item.color} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E3448', whiteSpace: 'nowrap' }}>{item.val}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DEDICATED OVERLAYS (Energy, Fuel, Weather) */}
      {activeTab === 'energy' && (
        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Zap size={20} color="#2563EB" />
            <h3 style={{ margin: 0, fontSize: '17px', color: '#1E3448' }}>Electrical Energy Flow Schematic</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F0F8FD', border: '1px solid #D8E7F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>GENERATION OUTPUT</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#12304A', margin: '4px 0' }}>
                {stationIntel.energy?.currentGeneration ?? 492} kW
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Supplied by active diesel generator bus</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>CURRENT DEMAND</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E3448', margin: '4px 0' }}>
                {stationIntel.energy?.estimatedDemand ?? (selectedStation?.code === 'MTR' ? 410 : 426)} kW
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Combined habitat, science, and life support</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>SAFETY MARGIN</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16A34A', margin: '4px 0' }}>
                +{stationIntel.energy?.energyMargin ?? (selectedStation?.code === 'MTR' ? 82 : 66)} kW
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{stationIntel.energy?.safetyMarginPercent ?? (selectedStation?.code === 'MTR' ? 20.0 : 15.5)}% operational buffer</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fuel' && (
        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Fuel size={20} color="#D97706" />
            <h3 style={{ margin: 0, fontSize: '17px', color: '#1E3448' }}>Fuel Distribution & Runtime Trajectory</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706' }}>PRIMARY RESERVOIR</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#12304A', margin: '4px 0' }}>
                {stationIntel.fuel?.level ?? (selectedStation?.code === 'MTR' ? 84.09 : 73.0)}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Capacity: ~{selectedStation?.code === 'MTR' ? '50,400' : '36,500'} L arctic grade diesel</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>BURN RATE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E3448', margin: '4px 0' }}>
                {stationIntel.fuel?.consumptionRatePercentPerDay ?? (selectedStation?.code === 'MTR' ? 3.4 : 3.8)}% / Day
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Telemetry regression slope over 24h</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>AUTONOMOUS RUNWAY</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB', margin: '4px 0' }}>
                {stationIntel.fuel?.remainingRuntimeDays ?? (selectedStation?.code === 'MTR' ? 24.7 : 19.2)} Days
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Projected until mandatory resupply</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'environment' && (
        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CloudRain size={20} color="#0284C7" />
            <h3 style={{ margin: 0, fontSize: '17px', color: '#1E3448' }}>Antarctic Environmental Stress Model</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F0F8FD', border: '1px solid #D8E7F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7' }}>AMBIENT TEMPERATURE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#12304A', margin: '4px 0' }}>
                {stationIntel.environmental?.temperature || -30.2}°C
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Condition: {stationIntel.environmental?.condition || 'SEVERE COLD'}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706' }}>STRESS FACTOR</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#D97706', margin: '4px 0' }}>
                {stationIntel.environmental?.stressFactor || 0.60} / 1.00
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Continuous polar climate stress penalty</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>THERMAL LOAD INFLATION</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E3448', margin: '4px 0' }}>
                +{stationIntel.environmental?.heatingDeltaPercent || 39}%
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Added electrical heating demand</div>
            </div>
          </div>
        </div>
      )}

      {/* 4b. DEDICATED LOGISTICS, SPARES & RESUPPLY OVERLAY */}
      {activeTab === 'logistics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Resupply Vessel Tracker Card */}
          <div style={{ ...cardStyle, padding: '24px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Anchor size={22} color="#2563EB" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#12304A' }}>
                      Expedition Resupply Tracker · {stationIntel.logistics?.resupplyVessel?.vesselName || 'MV Vasiliy Golovnin'}
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                      44th ISEA CHARTER
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                    NCPOR / MoES Annual Antarctic Resupply Vessel · {stationIntel.logistics?.resupplyVessel?.voyagePhaseLabel || 'En Route in Southern Ocean'}
                  </p>
                </div>
              </div>

              {/* Countdown Pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0'
              }}>
                <Clock size={18} color="#16A34A" />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>Ice Shelf Berthing ETA</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#16A34A' }}>
                    {stationIntel.logistics?.resupplyVessel?.daysUntilArrival ?? 92} Days
                  </div>
                </div>
              </div>
            </div>

            {/* Vessel Metadata & Cargo Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>POLAR WINDOW STATUS</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3448', margin: '4px 0' }}>
                  Austral Summer (Dec–Mar)
                </div>
                <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>Fast-Ice Berthing Window Active</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>VESSEL INBOUND POSITION</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3448', margin: '4px 0' }}>
                  54.2° S, {selectedStation?.code === 'MTR' ? '22.1° E' : '46.8° E'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Speed: 13.4 kts · DNV 1A Arc7 Ice Class</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>INBOUND BULK FUEL</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB', margin: '4px 0' }}>
                  {selectedStation?.code === 'MTR' ? '210,000' : '280,000'} Litres
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Arctic Jet A-1 & Polar High-Flash Diesel</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>CRITICAL OVERHAUL CRATES</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#7C3AED', margin: '4px 0' }}>
                  {selectedStation?.code === 'MTR' ? '16 Crated Kits' : '22 Crated Kits'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Including scheduled generator overhaul blocks</div>
              </div>
            </div>

            {/* Consumable Runway Progress */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                STATION CONSUMABLE SURVIVAL RUNWAYS & BUFFER DAYS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Polar Diesel (Power & Heat)', days: stationIntel.fuel?.remainingRuntimeDays ?? 19.2, status: 'Active Watch', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                  { label: selectedStation?.code === 'MTR' ? 'Priyadarshini Lake Water' : 'Melt Plant Potable Water', days: selectedStation?.code === 'MTR' ? 41 : 54, status: 'Optimal', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
                  { label: 'Cryo & Dehydrated Provisions', days: 340, status: 'Fully Stocked', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                  { label: 'Medical Oxygen & Critical Care', days: 420, status: 'Fully Stocked', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' }
                ].map((run, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: run.bg, border: `1px solid ${run.border}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: run.color }}>{run.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E3448', margin: '2px 0' }}>{run.days} Days</div>
                    <div style={{ fontSize: '11px', color: run.color, fontWeight: 600 }}>Status: {run.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Station Spare Parts Catalog & Local Inventory */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Boxes size={20} color="#2563EB" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#12304A' }}>
                    {selectedStation?.name} Critical Spare Parts & Equipment Inventory
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  On-station workshop stock mapped to active infrastructure. 280-day lead time outside Austral Summer.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', border: '1px solid #D8E7F0', borderRadius: '8px', padding: '6px 12px' }}>
                  <Search size={14} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Search spare name, SKU, asset..."
                    value={sparesSearch}
                    onChange={(e) => setSparesSearch(e.target.value)}
                    style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '12px', color: '#1E3448', width: '180px' }}
                  />
                </div>

                <select
                  value={sparesCategory}
                  onChange={(e) => setSparesCategory(e.target.value)}
                  style={{
                    fontSize: '12px', fontWeight: 600, padding: '7px 12px',
                    borderRadius: '8px', border: '1px solid #D8E7F0', backgroundColor: '#FFFFFF',
                    color: '#1E3448', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="MECHANICAL">Mechanical & Generators</option>
                  <option value="HVAC">HVAC & Life Support</option>
                  <option value="ELECTRICAL">Electrical & Batteries</option>
                  <option value="PUMP">Pumping & Coolant</option>
                  <option value="FUEL">Fuel Systems</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>PART NAME & SKU</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>COMPATIBLE ASSETS</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>ON-STATION STOCK</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>STORAGE MODULE / BIN</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>STATUS</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(stationIntel.logistics?.sparesInventory || [])
                    .filter(item => {
                      if (sparesCategory !== 'ALL' && !item.category.includes(sparesCategory)) return false;
                      if (sparesSearch) {
                        const q = sparesSearch.toLowerCase();
                        return item.name.toLowerCase().includes(q) ||
                               item.partNumber.toLowerCase().includes(q) ||
                               item.compatibleAssets.some(a => a.toLowerCase().includes(q));
                      }
                      return true;
                    })
                    .map((item, idx) => {
                      const isLow = item.status === 'LOW' || item.quantityOnHand <= item.minThreshold;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700, color: '#1E3448' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B' }}>{item.partNumber}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {item.compatibleAssets.map((ca, i) => (
                                <span key={i} style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                  {ca}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: isLow ? '#D97706' : '#16A34A' }}>
                              {item.quantityOnHand} {item.unit}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Min threshold: {item.minThreshold}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {item.location}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                              backgroundColor: isLow ? '#FFFBEB' : '#F0FDF4',
                              color: isLow ? '#B45309' : '#16A34A',
                              border: `1px solid ${isLow ? '#FDE68A' : '#BBF7D0'}`
                            }}>
                              {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                const targetAssetId = item.compatibleAssets[0];
                                if (targetAssetId) {
                                  setSelectedAssetId(targetAssetId);
                                  const doc = assets.find(a => a.assetId === targetAssetId);
                                  if (doc) setDetailPanelAsset({ ...doc, intelligence: intelMap[targetAssetId] });
                                }
                              }}
                              style={{
                                fontSize: '12px', fontWeight: 600, padding: '5px 10px',
                                borderRadius: '6px', border: '1px solid #D8E7F0', backgroundColor: '#FFFFFF',
                                color: '#2563EB', cursor: 'pointer'
                              }}
                            >
                              Inspect Asset
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE TOPOLOGY GRAPH OR 2D OPERATIONAL SCHEMATIC */}
      {activeTab === 'topology' ? (
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitFork size={20} color="#2563EB" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E3448', margin: 0 }}>
                  Station Equipment & Electrical Dependency Graph
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                Interactive directed topology showing physical equipment dependencies and active cascade failure propagation paths. Click any node to inspect telemetry.
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsAnomalyModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700,
                  backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A'
                }}
              >
                <Zap size={13} color="#D97706" />
                Fault Simulator
              </button>
            </div>
          </div>

          <TopologyGraph
            assets={assets}
            intelligence={intelMap}
            dependencies={dependencies}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(asset) => {
              setSelectedAssetId(asset.assetId);
              setDetailPanelAsset({ ...asset, intelligence: intelMap[asset.assetId] });
            }}
          />
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="#2563EB" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E3448', margin: 0 }}>
                2D Operational Station Schematic
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              Select an asset to visualize upstream supply, downstream cascade dependencies, and live operational states.
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
              <span style={{ color: '#64748B' }}>Online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#D97706' }} />
              <span style={{ color: '#64748B' }}>Degraded</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
              <span style={{ color: '#64748B' }}>Critical / Root Risk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#EA580C', border: '1px solid #F97316' }} />
              <span style={{ color: '#64748B' }}>Direct Impact</span>
            </div>
          </div>
        </div>

        {/* 8 Logical Functional Zones Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {Object.entries(zoneBuckets).map(([zoneKey, zone]) => {
            if (zone.assets.length === 0) return null;
            const ZoneIcon = zone.icon;

            return (
              <div
                key={zoneKey}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Zone Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                  <ZoneIcon size={16} color="#2563EB" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E3448', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {zone.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 'auto' }}>
                    ({zone.assets.length})
                  </span>
                </div>

                {/* Asset Cards in this Zone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {zone.assets.map(asset => {
                    const vState = getAssetVisualState(asset);
                    const isSelected = selectedAssetId === asset.assetId;
                    const rStyle = riskColors[vState.risk] || riskColors.LOW;
                    const opStyle = opStatusColors[vState.opStatus] || opStatusColors.ONLINE;

                    // Cascade border & background highlighting
                    let borderHighlight = '1px solid #D8E7F0';
                    let bgHighlight = '#FFFFFF';
                    let roleBadge = null;

                    if (vState.cascadeRole === 'ROOT_RISK') {
                      borderHighlight = '2px solid #DC2626';
                      bgHighlight = '#FEF2F2';
                      roleBadge = { text: 'ROOT RISK', bg: '#DC2626', color: '#FFFFFF' };
                    } else if (vState.cascadeRole === 'SELECTED') {
                      borderHighlight = '2px solid #2563EB';
                      bgHighlight = '#EFF6FF';
                      roleBadge = { text: 'INSPECTED', bg: '#2563EB', color: '#FFFFFF' };
                    } else if (vState.cascadeRole === 'DIRECT_IMPACT') {
                      borderHighlight = '2px solid #EA580C';
                      bgHighlight = '#FFF7ED';
                      roleBadge = { text: 'DIRECT IMPACT', bg: '#EA580C', color: '#FFFFFF' };
                    } else if (vState.cascadeRole === 'SECONDARY_IMPACT') {
                      borderHighlight = '1.5px solid #F59E0B';
                      bgHighlight = '#FEF3C7';
                      roleBadge = { text: 'SECONDARY IMPACT', bg: '#D97706', color: '#FFFFFF' };
                    }

                    const isDimmed = selectedAssetId && vState.cascadeRole === 'UNAFFECTED';

                    return (
                      <div
                        key={asset._id}
                        onClick={() => setSelectedAssetId(asset.assetId)}
                        style={{
                          backgroundColor: bgHighlight,
                          border: borderHighlight,
                          borderRadius: '8px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          opacity: isDimmed ? 0.45 : 1.0,
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.12)' : 'none'
                        }}
                      >
                        {/* Top: Asset ID, Role Badge, Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E3448' }}>
                              {asset.assetId}
                            </span>
                            {roleBadge && (
                              <span style={{
                                fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px',
                                backgroundColor: roleBadge.bg, color: roleBadge.color, letterSpacing: '0.05em'
                              }}>
                                {roleBadge.text}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: opStyle.dot }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: opStyle.text }}>
                              {vState.opStatus}
                            </span>
                          </div>
                        </div>

                        {/* Name & Type */}
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                          {asset.name}
                        </div>

                        {/* Bottom Row: Risk Badge, Criticality, Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                              backgroundColor: rStyle.bg, color: rStyle.text, border: `1px solid ${rStyle.border}`
                            }}>
                              {vState.risk} RISK
                            </span>
                            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                              {asset.criticality}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailPanelAsset({ ...asset, intelligence: intelMap[asset.assetId] });
                            }}
                            style={{
                              fontSize: '11px', fontWeight: 700, color: '#2563EB', background: 'none',
                              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px'
                            }}
                          >
                            Details <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 6. ROOT CAUSE & CASCADE IMPACT COCKPIT (Part M, H) */}
      {selectedAssetDoc && (
        <div style={{ ...cardStyle, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                backgroundColor: selectedVisualState.risk === 'HIGH' || selectedVisualState.risk === 'CRITICAL' ? '#FEF2F2' : '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Cpu size={20} color={selectedVisualState.risk === 'HIGH' || selectedVisualState.risk === 'CRITICAL' ? '#DC2626' : '#2563EB'} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  {selectedVisualState.risk === 'HIGH' || selectedVisualState.risk === 'CRITICAL' ? 'ROOT CAUSE DIAGNOSIS' : 'EQUIPMENT DIAGNOSTICS'}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E3448', margin: 0 }}>
                  {selectedAssetDoc.assetId} — {selectedAssetDoc.name}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setDetailPanelAsset(selectedAssetDoc)}
                style={{
                  fontSize: '13px', fontWeight: 700, padding: '8px 14px',
                  borderRadius: '8px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF',
                  color: '#2563EB', cursor: 'pointer'
                }}
              >
                Open Full Telemetry Chart
              </button>
            </div>
          </div>

          {/* Diagnostic Evidence & Downstream Cascade Chain */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* Observed Empirical Evidence */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                EMPIRICAL TELEMETRY EVIDENCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Vibration Harmonic:</span>
                  <strong style={{ color: selectedVisualState.telemetry.vibration > 0.2 ? '#DC2626' : '#1E3448' }}>
                    {selectedVisualState.telemetry.vibration ? `${selectedVisualState.telemetry.vibration.toFixed(2)} mm/s` : '0.14 mm/s'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Core Temperature:</span>
                  <strong style={{ color: selectedVisualState.telemetry.temperature > 85 ? '#DC2626' : '#1E3448' }}>
                    {selectedVisualState.telemetry.temperature ? `${selectedVisualState.telemetry.temperature.toFixed(1)}°C` : '78.2°C'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>ML Anomaly Score:</span>
                  <strong style={{ color: selectedVisualState.anomaly.score > 0.4 ? '#DC2626' : '#16A34A' }}>
                    {selectedVisualState.anomaly.score ? `${(selectedVisualState.anomaly.score * 100).toFixed(0)}%` : '12%'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Failure Probability:</span>
                  <strong style={{ color: selectedVisualState.failureProb > 0.4 ? '#DC2626' : '#16A34A' }}>
                    {selectedVisualState.failureProb ? `${(selectedVisualState.failureProb * 100).toFixed(0)}%` : '8%'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Downstream Cascade Propagation Chain */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                DOWNSTREAM CASCADE PATH ({selectedChain.direct.length + selectedChain.secondary.length} Assets)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedChain.direct.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>No downstream critical dependencies.</div>
                ) : (
                  <>
                    <div style={{ fontSize: '12px', color: '#1E3448' }}>
                      <strong style={{ color: '#EA580C' }}>Direct Impact:</strong> {selectedChain.direct.join(', ')}
                    </div>
                    {selectedChain.secondary.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#1E3448' }}>
                        <strong style={{ color: '#D97706' }}>Secondary Impact:</strong> {selectedChain.secondary.join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', marginTop: '4px' }}>
                      Derived from canonical Antarctic dependency model.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recommended Response */}
            <div style={{ backgroundColor: '#F0FDF4', borderRadius: '8px', padding: '14px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', marginBottom: '8px' }}>
                RECOMMENDED OPERATIONAL RESPONSE
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#12304A', marginBottom: '4px' }}>
                {selectedVisualState.risk === 'HIGH' || selectedVisualState.risk === 'CRITICAL'
                  ? (selectedStation.code === 'MTR' ? 'Synchronize Standby Generator (MTR-DG-02)' : 'Synchronize Standby Generator (DG-002)')
                  : 'Maintain Standard Baseline Surveillance'}
              </div>
              <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 10px', lineHeight: '1.4' }}>
                {selectedVisualState.risk === 'HIGH' || selectedVisualState.risk === 'CRITICAL'
                  ? 'Restores N+1 electrical redundancy and enables mechanical isolation of the degraded generator before unscheduled trip.'
                  : 'All operational parameters and vibrational harmonics remain within Antarctic safety limits.'}
              </p>
              <button
                onClick={() => navigate('/decision-center')}
                style={{
                  fontSize: '12px', fontWeight: 700, color: '#2563EB', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                Go to Decision Center <ArrowRight size={13} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. SLIDE-OUT ASSET DETAIL PANEL (Part I) */}
      {detailPanelAsset && (
        <AssetDetailPanel
          asset={detailPanelAsset}
          onClose={() => setDetailPanelAsset(null)}
        />
      )}

      {/* 8. LIVE ANOMALY TESTING CONSOLE MODAL */}
      <AnomalyTriggerModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        activeStation={selectedStation}
        onTriggerSuccess={() => loadStationData(true)}
      />

    </div>
  );
}
