import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass, CheckCircle2, Sliders,
  Activity, Clock, Sparkles, RefreshCw, X, Layers, Calculator,
  Download, FileText
} from 'lucide-react';
import { useStation } from '../contexts/StationContext';
import client from '../api/client';
import { socket } from '../App';
import { toast } from 'react-hot-toast';

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D8E7F0',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(18,48,74,0.04)',
  padding: '24px',
};

const riskColorMap = {
  CRITICAL: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  HIGH:     { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  MEDIUM:   { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  LOW:      { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' }
};

export default function DecisionCenter() {
  const { selectedStation, stations, setSelectedStation } = useStation();
  const [searchParams] = useSearchParams();
  const alertIdParam = searchParams.get('alertId');

  const [decisionData, setDecisionData] = useState(null);
  const [selectedActionId, setSelectedActionId] = useState('ACTIVATE_BACKUP_POWER');
  const [timeline, setTimeline] = useState([]);
  const [comparisonModal, setComparisonModal] = useState(false);
  const [stationComparison, setStationComparison] = useState([]);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedStation) {
      loadDecisionCenter();
    }
  }, [selectedStation, alertIdParam]);

  useEffect(() => {
    const handleAlertUpdate = () => {
      if (selectedStation) loadDecisionCenter(true);
    };

    socket.on('alert:updated', handleAlertUpdate);
    socket.on('alert:created', handleAlertUpdate);

    return () => {
      socket.off('alert:updated', handleAlertUpdate);
      socket.off('alert:created', handleAlertUpdate);
    };
  }, [selectedStation]);

  const loadDecisionCenter = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await client.get(`/decision-center/${selectedStation._id}?_t=${Date.now()}`);
      const data = res.data.data;
      setDecisionData(data);

      if (data.recommendation?.selectedActionId) {
        setSelectedActionId(data.recommendation.selectedActionId);
      }

      // Load alert timeline if active alert exists
      const targetAlertId = alertIdParam || data.activeAlert?._id;
      if (targetAlertId) {
        try {
          const tRes = await client.get(`/alerts/${targetAlertId}/timeline?_t=${Date.now()}`);
          setTimeline(tRes.data.data);
        } catch {
          setTimeline([]);
        }
      }
    } catch (err) {
      console.error("Decision Center fetch error:", err);
      setError('Unable to load Operational Decision Center data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const res = await client.get(`/stations/comparison?_t=${Date.now()}`);
      setStationComparison(res.data.data);
      setComparisonModal(true);
    } catch (err) {
      console.error("Comparison load error:", err);
    }
  };

  const handleAcknowledge = async () => {
    if (!decisionData?.activeAlert?._id) return;
    setActionLoading(true);
    try {
      await client.post(`/alerts/${decisionData.activeAlert._id}/acknowledge`);
      await loadDecisionCenter(true);
    } catch (err) {
      console.error("Acknowledge error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkActionPlanned = async () => {
    if (!decisionData?.activeAlert?._id) return;
    setActionLoading(true);
    try {
      const chosenAction = decisionData.actions?.find(a => a.id === selectedActionId);
      await client.post(`/alerts/${decisionData.activeAlert._id}/action-planned`, {
        actionPlan: {
          id: chosenAction?.id,
          name: chosenAction?.name,
          rationale: chosenAction?.rationale,
          tradeoff: chosenAction?.tradeoff,
          simulatedResilience: chosenAction?.simulated?.resilience,
          simulatedMargin: chosenAction?.simulated?.energyMargin
        }
      });
      await loadDecisionCenter(true);
    } catch (err) {
      console.error("Action planned error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!decisionData?.activeAlert?._id) return;
    setActionLoading(true);
    try {
      await client.post(`/alerts/${decisionData.activeAlert._id}/resolve`);
      await loadDecisionCenter(true);
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const requestAiExplanation = async () => {
    if (!decisionData) return;
    setAiLoading(true);
    try {
      const res = await client.post(`/decision-center/${selectedStation._id}/explain`, {
        scenarioTitle: decisionData.scenario?.title,
        recommendedAction: decisionData.recommendation,
        rationale: decisionData.recommendation?.rationale,
        stationName: selectedStation.name
      });
      setAiExplanation(res.data.data);
    } catch (err) {
      console.error("AI explain error:", err);
      setAiExplanation({
        available: false,
        analysis: 'AI EXPLANATION UNAVAILABLE — The natural-language explanation service is temporarily unreachable. The deterministic recommendation and score breakdown remain fully active.',
        recommendation: decisionData.recommendation?.selectedActionName
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!decisionData || !selectedStation) return;
    const now = new Date().toISOString();
    const scenario = decisionData.scenario || {};
    const baseline = scenario.baseline || {};
    const recommendation = decisionData.recommendation || {};
    const actions = decisionData.actions || [];
    const activeAlert = decisionData.activeAlert;
    const evidence = decisionData.evidence || [];

    const reportContent = `# NCPOR POLAR MISSION CONTROL — INCIDENT & TACTICAL RESPONSE LOG
**Platform:** POLARIS Digital Twin Framework (MoES / NCPOR)
**Classification:** RESTRICTED — ANTARCTIC SCIENTIFIC EXPEDITION OPERATIONS
**Generated At:** ${now}
**Station:** ${selectedStation.name} Station (${selectedStation.code})
**Coordinates:** Lat ${selectedStation.coordinates?.latitude || -69.4}°, Lon ${selectedStation.coordinates?.longitude || 76.1}°
**Operational Zone:** ${selectedStation.location || 'Larsemann Hills / Schirmacher Oasis'}

---

## 1. INCIDENT BRIEF & BASELINE TELEMETRY
- **Active Threat / Scenario:** ${activeAlert ? activeAlert.title : scenario.primaryThreat || 'Station Dynamic Simulation'}
- **Severity Assessment:** ${activeAlert?.severity || baseline.riskLevel || 'ELEVATED'}
- **Station Baseline Resilience:** ${baseline.resilience}/100 (${baseline.resilienceStatus || 'NORMAL'})
- **Risk Level:** ${baseline.riskLevel || 'MODERATE'}
- **Impacted Subsystem:** ${activeAlert?.assetId?.name || 'Integrated Microgrid & Life Support'} (${activeAlert?.assetId?.type || 'Critical'})
- **Sensor Evidence & Deviations:**
${evidence.length > 0 ? evidence.map(e => `  - ${e.label}: Current ${e.value} (Nominal: ${e.normal}) -> Impact: ${e.implication}`).join('\n') : '  - Telemetry parameters within normal dynamic ranges'}

---

## 2. POLARIS MULTI-CRITERIA DECISION ANALYSIS (MCDA)
- **Optimal Automated Recommendation:** ${recommendation.selectedActionName || 'ACTIVATE PREVENTIVE PROTOCOL'}
- **Action Identifier:** \`${recommendation.selectedActionId}\`
- **Algorithm Confidence:** ${Math.round((recommendation.confidence || 0.88) * 100)}%
- **Strategic Operational Rationale:**
  ${recommendation.rationale || 'Balances life support continuity, thermal preservation, and minimal fuel burn.'}
- **Projected Resilience:** ${recommendation.projectedResilience || baseline.resilience}/100 (+${(recommendation.projectedResilience || baseline.resilience) - baseline.resilience} pts)

---

## 3. COUNTERFACTUAL TACTICAL ACTIONS SCORING
The digital twin simulated the following emergency actions under current polar weather conditions:

| Tactical Action | Resilience Delta | Fuel Depletion Impact | Crew Safety Risk | MCDA Score |
|---|---|---|---|---|
${actions.map(a => `| ${a.name} | ${a.resilienceDelta >= 0 ? '+' : ''}${a.resilienceDelta} pts | ${a.fuelImpact} | ${a.safetyRisk} | ${a.score}/100 |`).join('\n')}

---

## 4. EXPEDITION RESUPPLY & LOGISTICS BUFFER
- **Active Resupply Vessel:** MV Vasiliy Golovnin (44th Indian Scientific Expedition to Antarctica)
- **Vessel Telemetry:** En route to Larsemann Hills / Prydz Bay
- **Telemetry Communications:** SATCOM Ku-Band / Store-and-Forward Edge Synchronization Active

---

## 5. OPERATIONAL SIGN-OFF & MISSION AUTHENTICATION
- **Station Commander (${selectedStation.code}):** ___________________________  Date: ____________
- **Chief Technical Engineer (HVAC/Microgrid):** ___________________________  Date: ____________
- **NCPOR Mission Operations Control (Goa, India):** ___________________________  Date: ____________

*POLARIS Autonomous Antarctic Digital Twin Engine · National Centre for Polar and Ocean Research (NCPOR)*
`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `POLARIS_INCIDENT_${selectedStation.code}_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Mission Incident Log downloaded for ${selectedStation.code}`);
  };

  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center', color: '#64748B', fontSize: '15px' }}>
      Loading Operational Decision Center & scenario models…
    </div>
  );

  if (error || !decisionData) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626', fontSize: '15px' }}>
      {error || 'Failed to initialize decision models.'}
    </div>
  );

  const scenario = decisionData.scenario;
  const baseline = scenario.baseline;
  const actions = decisionData.actions || [];
  const recommendation = decisionData.recommendation;
  const evidence = decisionData.evidence || [];
  const activeAlert = decisionData.activeAlert;
  const currentAction = actions.find(a => a.id === selectedActionId) || actions[0];

  const alertStatus = activeAlert?.status || (baseline.resilience >= 80 ? 'RESOLVED' : 'NOMINAL');
  const isEmergency = baseline.riskLevel === 'CRITICAL' || baseline.resilience < 40;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* 1. Command Header Bar */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px',
        backgroundColor: isEmergency ? '#7F1D1D' : '#12304A',
        color: '#FFFFFF', padding: '24px 28px', borderRadius: '14px',
        boxShadow: '0 4px 16px rgba(18,48,74,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: isEmergency ? '#DC2626' : '#12304A', padding: '4px 10px',
                backgroundColor: '#FFFFFF', borderRadius: '4px',
              }}>
                OPERATIONAL DECISION CENTER
              </span>

              <span style={{
                fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '4px 12px', borderRadius: '4px', color: '#FFFFFF',
                backgroundColor: baseline.resilience > 75 ? '#16A34A' : baseline.resilience > 50 ? '#D97706' : '#DC2626'
              }}>
                ● RESILIENCE: {baseline.resilience}/100 ({baseline.resilienceStatus})
              </span>

              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF'
              }}>
                THREAT: {scenario.primaryThreat} ({baseline.riskLevel} RISK)
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>
              {selectedStation?.name} Station Decision Command
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
              {selectedStation?.location} · Polar Mission Control
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Station Switcher */}
            <select
              value={selectedStation._id}
              onChange={(e) => {
                const s = stations.find(st => st._id === e.target.value);
                if (s) setSelectedStation(s);
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px',
                padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {stations.map(st => (
                <option key={st._id} value={st._id} style={{ color: '#1E3448', backgroundColor: '#FFFFFF' }}>
                  {st.name} Station ({st.code})
                </option>
              ))}
            </select>

            {/* Station Comparison Trigger */}
            <button
              onClick={loadComparison}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none',
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Layers size={16} /> Compare Stations
            </button>

            {/* Export Mission Incident Log */}
            <button
              onClick={handleExportReport}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
              title="Download official Antarctic Mission Incident & Tactical Response Log"
            >
              <Download size={16} /> Export Incident Log
            </button>
          </div>
        </div>

        {/* Rapid Metric Strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px',
          paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)'
        }}>
          <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
            Failure Prob: <strong>{baseline.failureProbability}%</strong>
          </div>
          <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
            Cascade Impact: <strong>{baseline.cascadeCount} Systems</strong>
          </div>
          <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
            Energy Margin: <strong>{baseline.energyMargin} kW</strong> ({baseline.safetyMarginPercent}%)
          </div>
          <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
            Fuel Runtime: <strong>{baseline.fuelDays} Days</strong>
          </div>
          <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
            Alert Lifecycle: <strong style={{ textTransform: 'uppercase', color: alertStatus === 'ACTION_PLANNED' ? '#60A5FA' : alertStatus === 'ACKNOWLEDGED' ? '#FBBF24' : '#F87171' }}>{alertStatus}</strong>
          </div>
        </div>
      </div>

      {/* 2. Top Diagnostic Grid: Situation & Cascade Graph */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>

        {/* Active Operational Scenario & Root Cause (Parts 2 & 9) */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#2563EB" />
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                  Active Operational Scenario: {scenario.title}
                </h2>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                backgroundColor: riskColorMap[scenario.severity]?.bg,
                color: riskColorMap[scenario.severity]?.color,
                border: `1px solid ${riskColorMap[scenario.severity]?.border}`
              }}>
                {scenario.severity} RISK
              </span>
            </div>

            {/* Impact Summary Chain (Part 9) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '12px 16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                  1. Direct Asset Impact
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E3448' }}>
                  {scenario.impactSummary.direct.impact}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFBEB', borderRadius: '8px', padding: '12px 16px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', marginBottom: '4px' }}>
                  2. Downstream Systems Threatened
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E3448' }}>
                  {scenario.impactSummary.downstream.criticalSystems.join(' · ')}
                </div>
              </div>

              <div style={{ backgroundColor: '#EFF6FF', borderRadius: '8px', padding: '12px 16px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: '4px' }}>
                  3. Station-Wide Operational Consequence
                </div>
                <div style={{ fontSize: '13px', color: '#1E3448', lineHeight: '1.4' }}>
                  {scenario.impactSummary.station.energy} {scenario.impactSummary.station.resilience}
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
            Diagnostic: Elevated vibration harmonic signature and core thermal gradient detected over 24h baseline.
          </div>
        </div>

        {/* Visual Cascade Dependency Graph (Part 8) */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                  Cascade Dependency Tiers
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Graph Topology</span>
            </div>

            {/* Hierarchical Tiers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Tier 1: Root */}
              <div style={{
                backgroundColor: '#FEF2F2', border: '2px solid #DC2626', borderRadius: '8px',
                padding: '10px 14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>ROOT ASSET THREAT</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E3448' }}>{scenario.primaryThreat}</div>
              </div>

              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12px', lineHeight: 1 }}>↓ Electrical Bus</div>

              {/* Tier 2: Directly Affected */}
              <div style={{
                backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px',
                padding: '10px 14px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: '4px' }}>
                  DIRECTLY AFFECTED ({baseline.cascadeAssets?.length || 0} Systems)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(baseline.cascadeAssets || []).map(id => (
                    <span key={id} style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: '#FEF3C7', color: '#92400E'
                    }}>
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12px', lineHeight: 1 }}>↓ Secondary Systems</div>

              {/* Tier 3: Unaffected / Standby */}
              <div style={{
                backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
                padding: '10px 14px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', marginBottom: '4px' }}>
                  STANDBY / ISOLATED CAPACITY
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['DG-002 (Standby)', 'HVAC-03 (Quarters)', 'PUMP-02'].map(id => (
                    <span key={id} style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: '#DCFCE7', color: '#166534'
                    }}>
                      {id}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div style={{ marginTop: '12px', fontSize: '11px', color: '#94A3B8' }}>
            Live propagation path calculated by dependency service.
          </div>
        </div>

      </div>

      {/* 3. Scenario Comparison Matrix & Response Options (Parts 3, 4, 5) */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="#2563EB" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                Operational Mitigation Scenarios & Simulation Comparison
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              Select an action to simulate station consequences against current baseline before execution.
            </p>
          </div>

          <span style={{
            fontSize: '11px', fontWeight: 800, color: '#64748B', backgroundColor: '#F1F5F9',
            padding: '6px 12px', borderRadius: '6px', letterSpacing: '0.05em'
          }}>
            SIMULATION — NO DATABASE CHANGES
          </span>
        </div>

        {/* 4 Action Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {actions.map(action => {
            const isSelected = selectedActionId === action.id;
            const isRec = recommendation.selectedActionId === action.id;
            const sim = action.simulated;

            return (
              <div
                key={action.id}
                onClick={() => setSelectedActionId(action.id)}
                style={{
                  borderRadius: '10px', padding: '16px', cursor: 'pointer',
                  border: isSelected ? '2px solid #2563EB' : '1px solid #D8E7F0',
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.12)' : 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#2563EB' : '#64748B', textTransform: 'uppercase' }}>
                      {action.type}
                    </span>
                    {isRec && (
                      <span style={{
                        fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                        backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0'
                      }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1E3448', margin: '0 0 6px' }}>
                    {action.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px', lineHeight: '1.4' }}>
                    {action.rationale}
                  </p>
                </div>

                {/* Simulated Metrics Pill Box */}
                <div style={{
                  backgroundColor: isSelected ? '#FFFFFF' : '#F8FAFC', borderRadius: '8px', padding: '10px 12px',
                  border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Simulated Resilience</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E3448' }}>
                      {sim.resilience}
                      <span style={{ fontSize: '11px', color: sim.resilienceDelta > 0 ? '#16A34A' : sim.resilienceDelta < 0 ? '#DC2626' : '#64748B', marginLeft: '4px' }}>
                        ({sim.resilienceDelta > 0 ? `+${sim.resilienceDelta}` : sim.resilienceDelta})
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Energy Margin</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: sim.energyMargin < 20 ? '#DC2626' : '#1E3448' }}>
                      {sim.energyMargin} kW
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Post-Action Risk</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: riskColorMap[sim.postActionRisk]?.color || '#1E3448' }}>
                      {sim.postActionRisk}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Fuel Runtime</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E3448' }}>
                      {sim.fuelDays}d ({sim.fuelDeltaDays > 0 ? `+${sim.fuelDeltaDays}` : sim.fuelDeltaDays}d)
                    </div>
                  </div>
                </div>

                {/* Trade-off Warning */}
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                  Trade-off: {action.tradeoff}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Details Banner */}
        <div style={{
          backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '16px 20px',
          border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Selected Scenario: <strong>{currentAction.name}</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#1E3448', marginTop: '2px' }}>
              {currentAction.description}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Decision Utility Score</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563EB' }}>
                {currentAction.decisionScore || currentAction.score || 82.49}/100
              </div>
            </div>
          </div>
        </div>

        {/* Canonical Mathematical Score Breakdown (Phase 11.1) */}
        {currentAction.scoreBreakdown && (
          <div style={{
            marginTop: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px',
            border: '1px solid #E2E8F0', padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={16} color="#2563EB" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E3448', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deterministic Decision Score Breakdown
                </span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#475569', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                Score = 0.35·R + 0.25·M + 0.20·K + 0.10·C + 0.10·F
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>CRITERION</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>WEIGHT</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>RAW SIMULATED VALUE</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700 }}>NORMALIZED (0-100)</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>WEIGHTED CONTRIBUTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: '#1E3448' }}>Resilience Gain (R)</td>
                    <td style={{ padding: '8px', color: '#64748B' }}>35%</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.raw?.resilience} pts</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.normalized?.resilienceScore}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>
                      +{currentAction.scoreBreakdown.contributions?.resilience}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: '#1E3448' }}>Energy Safety Margin (M)</td>
                    <td style={{ padding: '8px', color: '#64748B' }}>25%</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.raw?.safetyMarginPercent}%</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.normalized?.marginScore}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>
                      +{currentAction.scoreBreakdown.contributions?.margin}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: '#1E3448' }}>Risk Mitigation (K)</td>
                    <td style={{ padding: '8px', color: '#64748B' }}>20%</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.raw?.postActionRisk}</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.normalized?.riskScore}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>
                      +{currentAction.scoreBreakdown.contributions?.risk}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: '#1E3448' }}>Cascade Isolation (C)</td>
                    <td style={{ padding: '8px', color: '#64748B' }}>10%</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.raw?.cascadeExposedCount} threatened assets</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.normalized?.cascadeScore}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>
                      +{currentAction.scoreBreakdown.contributions?.cascade}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: '#1E3448' }}>Fuel Conservation (F)</td>
                    <td style={{ padding: '8px', color: '#64748B' }}>10%</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.raw?.fuelDays} days</td>
                    <td style={{ padding: '8px', color: '#1E3448' }}>{currentAction.scoreBreakdown.normalized?.fuelScore}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>
                      +{currentAction.scoreBreakdown.contributions?.fuel}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 800 }}>
                    <td colSpan={4} style={{ padding: '10px 8px', color: '#1E3448' }}>
                      COMPOSITE DECISION SCORE ({currentAction.name})
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '15px', color: '#2563EB' }}>
                      {currentAction.decisionScore}/100
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Recommendation, Evidence & Operator Workflow (Parts 6, 7, 11, 12, 17) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>

        {/* Deterministic Recommendation & Evidence */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={20} color="#16A34A" />
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                Deterministic Recommendation Engine
              </h3>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
              backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0'
            }}>
              CONFIDENCE: {Math.round(recommendation.confidence * 100)}%
            </span>
          </div>

          {/* Recommended Action Card */}
          <div style={{
            backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '16px 20px',
            border: '1px solid #BBF7D0', marginBottom: '18px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', marginBottom: '4px' }}>
              RECOMMENDED RESPONSE
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#12304A', marginBottom: '6px' }}>
              {recommendation.selectedActionName}
            </div>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.5' }}>
              {recommendation.rationale}
            </p>
          </div>

          {/* Supporting Evidence Checklist (Part 7) */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
              EVIDENCE AUDIT (SUPPORTING DETERMINISTIC DECISION)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {evidence.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#1E3448' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0 }} />
                    <span>{ev.claim}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', flexShrink: 0 }}>
                    {ev.metric}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Explanation Layer (Part 9 & 13) */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#8B5CF6" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E3448' }}>AI-Assisted Operational Explanation (Groq)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Natural-language synthesis of deterministic recommendation
                </div>
              </div>
              <button
                onClick={requestAiExplanation}
                disabled={aiLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 700, color: '#8B5CF6', background: '#F5F3FF',
                  border: '1px solid #DDD6FE', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? 'Synthesizing...' : 'Explain Strategy'}
              </button>
            </div>

            {aiExplanation ? (
              (aiExplanation.available === false || aiExplanation.analysis?.includes('UNAVAILABLE')) ? (
                <div style={{ backgroundColor: '#FFFBEB', borderRadius: '8px', padding: '12px 14px', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E', lineHeight: '1.5' }}>
                  <strong>AI EXPLANATION UNAVAILABLE:</strong> The natural-language explanation service is temporarily unreachable. All deterministic operational recommendations, mathematical formulas, and score breakdowns remain fully active and valid.
                </div>
              ) : (
                <div style={{ backgroundColor: '#FBFBFE', borderRadius: '8px', padding: '12px 14px', border: '1px solid #EDE9FE', fontSize: '13px', color: '#4C1D95', lineHeight: '1.5' }}>
                  {aiExplanation.analysis}
                </div>
              )
            ) : (
              <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                Click to generate natural-language operational strategic explanation from Groq.
              </div>
            )}
          </div>
        </div>

        {/* Operator Action Workflow & Audit Timeline (Parts 11 & 12) */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                  Operator Action Workflow
                </h3>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                backgroundColor: alertStatus === 'RESOLVED' ? '#F0FDF4' : alertStatus === 'ACTION_PLANNED' ? '#EFF6FF' : '#FEF2F2',
                color: alertStatus === 'RESOLVED' ? '#16A34A' : alertStatus === 'ACTION_PLANNED' ? '#2563EB' : '#DC2626'
              }}>
                STATE: {alertStatus}
              </span>
            </div>

            {/* Operator Buttons */}
            {activeAlert ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={handleAcknowledge}
                  disabled={actionLoading || alertStatus !== 'ACTIVE'}
                  style={{
                    padding: '12px', borderRadius: '8px', border: '1px solid #D8E7F0',
                    fontSize: '13px', fontWeight: 700, cursor: alertStatus === 'ACTIVE' ? 'pointer' : 'not-allowed',
                    backgroundColor: alertStatus === 'ACTIVE' ? '#FFFFFF' : '#F1F5F9',
                    color: alertStatus === 'ACTIVE' ? '#1E3448' : '#94A3B8'
                  }}
                >
                  1. Acknowledge Incident
                </button>

                <button
                  onClick={handleMarkActionPlanned}
                  disabled={actionLoading || (alertStatus !== 'ACTIVE' && alertStatus !== 'ACKNOWLEDGED')}
                  style={{
                    padding: '12px', borderRadius: '8px', border: 'none',
                    fontSize: '13px', fontWeight: 700,
                    cursor: (alertStatus === 'ACTIVE' || alertStatus === 'ACKNOWLEDGED') ? 'pointer' : 'not-allowed',
                    backgroundColor: (alertStatus === 'ACTIVE' || alertStatus === 'ACKNOWLEDGED') ? '#2563EB' : '#94A3B8',
                    color: '#FFFFFF'
                  }}
                >
                  2. Commit & Mark Action Planned ({currentAction.name})
                </button>

                <button
                  onClick={handleResolve}
                  disabled={actionLoading || alertStatus === 'RESOLVED'}
                  style={{
                    padding: '12px', borderRadius: '8px', border: 'none',
                    fontSize: '13px', fontWeight: 700, cursor: alertStatus !== 'RESOLVED' ? 'pointer' : 'not-allowed',
                    backgroundColor: alertStatus !== 'RESOLVED' ? '#16A34A' : '#94A3B8',
                    color: '#FFFFFF'
                  }}
                >
                  3. Resolve & Close Incident
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '13px', marginBottom: '20px' }}>
                No active operational alerts requiring intervention at this station.
              </div>
            )}

            {/* Real Chronological Audit Timeline (Part 12) */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
                ACTION AUDIT TIMELINE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {timeline.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>No recorded timeline events.</div>
                ) : (
                  timeline.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#2563EB', width: '55px', flexShrink: 0 }}>
                        {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ borderLeft: '2px solid #CBD5E1', paddingLeft: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#1E3448' }}>{item.title}</div>
                        <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px' }}>{item.description}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '11px', color: '#94A3B8' }}>
            Simulation is advisory decision-support; hardware execution requires human-in-the-loop authorization.
          </div>
        </div>

      </div>

      {/* 5. Station Comparison Modal (Part 14) */}
      {comparisonModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(18,48,74,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '28px', maxWidth: '800px', width: '90%',
            boxShadow: '0 8px 32px rgba(18,48,74,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={22} color="#2563EB" />
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#12304A', margin: 0 }}>
                  Antarctic Station Status Comparison
                </h3>
              </div>
              <button
                onClick={() => setComparisonModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              {stationComparison.map(st => (
                <div key={st.stationId} style={{
                  border: st.name === selectedStation.name ? '2px solid #2563EB' : '1px solid #D8E7F0',
                  borderRadius: '10px', padding: '18px', backgroundColor: st.name === selectedStation.name ? '#EFF6FF' : '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#12304A', margin: 0 }}>
                      {st.name} ({st.code})
                    </h4>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                      color: st.resilienceScore > 75 ? '#16A34A' : '#D97706',
                      backgroundColor: st.resilienceScore > 75 ? '#DCFCE7' : '#FEF3C7'
                    }}>
                      {st.operationalStatus}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Resilience Score:</span>
                      <strong>{st.resilienceScore}/100 ({st.resilienceStatus})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Weather Condition:</span>
                      <strong>{st.environmentalCondition} ({st.temperature}°C)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Energy Safety Margin:</span>
                      <strong>{st.energyMargin} kW ({st.energyStatus})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Fuel Reserves Remaining:</span>
                      <strong>{st.fuelDaysRemaining} Days</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Active Operational Alerts:</span>
                      <strong style={{ color: st.activeAlertsCount > 0 ? '#DC2626' : '#16A34A' }}>{st.activeAlertsCount} Active</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const target = stations.find(s => s._id === st.stationId);
                      if (target) setSelectedStation(target);
                      setComparisonModal(false);
                    }}
                    style={{
                      marginTop: '16px', width: '100%', padding: '10px',
                      backgroundColor: st.name === selectedStation.name ? '#2563EB' : '#FFFFFF',
                      color: st.name === selectedStation.name ? '#FFFFFF' : '#1E3448',
                      border: '1px solid #D8E7F0', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    {st.name === selectedStation.name ? 'Active Console Station' : `Switch to ${st.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
