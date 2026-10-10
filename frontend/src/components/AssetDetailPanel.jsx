import { X, Box, Activity, Sliders, ArrowRight, Package, Wrench } from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import { useState, useEffect } from 'react';
import client from '../api/client';

const statusConfig = {
  NORMAL:   { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  WARNING:  { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  CRITICAL: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const riskColors = {
  LOW: '#16A34A',
  MEDIUM: '#D97706',
  HIGH: '#DC2626',
  CRITICAL: '#991B1B'
};

export default function AssetDetailPanel({ asset, onClose }) {
  const [telemetry, setTelemetry] = useState([]);
  const [telLoading, setTelLoading] = useState(true);
  const [spares, setSpares] = useState([]);
  const [sparesLoading, setSparesLoading] = useState(false);
  
  // Simulation State
  const [showSim, setShowSim] = useState(false);
  const [simTemp, setSimTemp] = useState(80);
  const [simVib, setSimVib] = useState(0.15);
  const [simLoad, setSimLoad] = useState(70);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => { 
    if (asset) {
      loadTelemetry();
      loadSpares();
      if (asset.intelligence && asset.intelligence.telemetry) {
        setSimTemp(asset.intelligence.telemetry.temperature || 80);
        setSimVib(asset.intelligence.telemetry.vibration || 0.15);
        setSimLoad(asset.intelligence.telemetry.generatorLoad || 70);
      }
    }
  }, [asset]);

  const loadSpares = async () => {
    if (!asset || !asset.stationId || !asset.assetId) return;
    setSparesLoading(true);
    try {
      const res = await client.get(`/stations/${asset.stationId}/assets/${asset.assetId}/spares`);
      setSpares(res.data.data || []);
    } catch {
      setSpares([]);
    } finally {
      setSparesLoading(false);
    }
  };

  const loadTelemetry = async () => {
    setTelLoading(true);
    try {
      const res = await client.get(`/telemetry/${asset._id}?limit=24`);
      setTelemetry(res.data.data.map(t => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        power: t.powerOutput || 0,
        vibration: t.vibration || 0,
        temp: t.temperature || 0,
      })));
    } catch {}
    finally { setTelLoading(false); }
  };

  const runSimulation = async () => {
    setSimLoading(true);
    try {
        const changes = {
            temperature: simTemp,
            vibration: simVib,
            generatorLoad: simLoad
        };
        const res = await client.post('/simulation', { assetId: asset.assetId, changes });
        setSimResult(res.data.data);
    } catch (err) {
        console.error(err);
    } finally {
        setSimLoading(false);
    }
  };

  if (!asset) return null;

  const intel = asset.intelligence || {};
  const riskLevel = intel.risk?.level || 'LOW';
  
  let opStatus = 'ONLINE';
  let opColor = '#16A34A';
  let opBg = '#F0FDF4';
  let opBorder = '#BBF7D0';

  if (asset.status === 'WARNING') { 
    opStatus = 'DEGRADED'; opColor = '#D97706'; opBg = '#FFFBEB'; opBorder = '#FDE68A'; 
  }
  if (asset.status === 'CRITICAL') { 
    opStatus = 'OFFLINE'; opColor = '#DC2626'; opBg = '#FEF2F2'; opBorder = '#FECACA'; 
  }

  const isAvailable = intel.status !== "UNAVAILABLE";
  const isGen = asset.type?.includes('Generator') || asset.assetId?.includes('DG');

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(18,48,74,0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 40,
        }}
      />

      <div
        className="slide-in-right"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '500px',
          maxWidth: '90vw',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #D8E7F0',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(18,48,74,0.12)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #D8E7F0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '12px',
              backgroundColor: opBg, border: `1px solid ${opBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box style={{ width: '22px', height: '22px', color: opColor }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#12304A', margin: 0 }}>{asset.name}</h2>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: opBg, color: opColor, border: `1px solid ${opBorder}`, letterSpacing: '0.05em' }}>
                  {opStatus}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                {asset.assetId} · {asset.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px', background: 'none', border: '1px solid #D8E7F0',
              borderRadius: '8px', cursor: 'pointer', color: '#64748B',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* System Intelligence */}
          {!isAvailable ? (
            <div style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>ML SERVICE OFFLINE</div>
                <div style={{ fontSize: '13px', color: '#991B1B', marginTop: '6px' }}>Station telemetry is available, but predictive intelligence is temporarily unavailable.</div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: '10px', padding: '20px', marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <Activity style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E3448' }}>SYSTEM INTELLIGENCE</span>
                </div>
                <button onClick={() => setShowSim(!showSim)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#2563EB', background: '#DBEAFE', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                    <Sliders size={14} /> What-If
                </button>
              </div>
              
              {!showSim ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '16px', border: '1px solid #D8E7F0' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', marginBottom: '6px' }}>
                            Risk Level
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: riskColors[intel.risk?.level] || '#12304A' }}>
                            {intel.risk?.level ?? 'UNKNOWN'}
                        </div>
                        </div>
                        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '16px', border: '1px solid #D8E7F0' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', marginBottom: '6px' }}>
                            Priority
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#12304A' }}>
                            {intel.decision?.priority ?? 'UNKNOWN'}
                        </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '12px', border: '1px solid #D8E7F0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>Anomaly Score</div>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>{Math.round((intel.anomaly?.score || 0) * 100)}%</div>
                        </div>
                        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '12px', border: '1px solid #D8E7F0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>Failure Probability</div>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>{Math.round((intel.failurePrediction?.probability || 0) * 100)}%</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E3448', marginBottom: '8px', textTransform: 'uppercase' }}>Why?</div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1E3448', lineHeight: '1.6' }}>
                            {intel.decision?.reason?.map((r, i) => <li key={i}>{r}</li>) || <li>No analysis available</li>}
                        </ul>
                    </div>

                    <div style={{
                        backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '16px',
                        border: '1px solid #D8E7F0',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E3448', marginBottom: '8px', textTransform: 'uppercase' }}>Recommended Action</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#2563EB' }}>
                            {intel.decision?.action ?? 'Monitor system.'}
                        </div>
                    </div>
                  </>
              ) : (
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '24px', border: '1px solid #D8E7F0' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E3448', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sliders size={18} /> WHAT-IF SCENARIO
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>
                              <span>Temperature</span> <span style={{ color: '#12304A', fontWeight: 700 }}>{simTemp} °C</span>
                          </div>
                          <input type="range" min="50" max="130" value={simTemp} onChange={(e) => setSimTemp(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>
                              <span>Vibration</span> <span style={{ color: '#12304A', fontWeight: 700 }}>{simVib} g</span>
                          </div>
                          <input type="range" min="0" max="2" step="0.05" value={simVib} onChange={(e) => setSimVib(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>
                              <span>Generator Load</span> <span style={{ color: '#12304A', fontWeight: 700 }}>{simLoad} %</span>
                          </div>
                          <input type="range" min="0" max="120" value={simLoad} onChange={(e) => setSimLoad(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                      </div>

                      <button 
                        onClick={runSimulation}
                        disabled={simLoading}
                        style={{ width: '100%', padding: '14px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {simLoading ? 'Running scenario through ML models...' : 'RUN SIMULATION'}
                      </button>

                      {simResult && (
                          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', backgroundColor: '#F1F5F9', padding: '5px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>
                                  SIMULATION — NO DATABASE CHANGES
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>
                                  SCENARIO IMPACT
                                </span>
                              </div>

                              {/* Station-Level Resilience Impact */}
                              {simResult.stationImpact && (
                                <div style={{
                                  backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '16px',
                                  border: '1px solid #BFDBFE', marginBottom: '16px'
                                }}>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E3448', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Activity size={16} color="#2563EB" /> Station Resilience Impact
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D8E7F0' }}>
                                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Station Resilience</div>
                                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E3448', marginTop: '2px' }}>
                                        {simResult.stationImpact.baselineResilience} → <span style={{ color: '#DC2626' }}>{simResult.stationImpact.simulatedResilience}</span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>
                                        -{simResult.stationImpact.resilienceDrop} pts
                                      </div>
                                    </div>

                                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D8E7F0' }}>
                                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Energy Margin</div>
                                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E3448', marginTop: '2px' }}>
                                        {simResult.stationImpact.baselineEnergyMargin} kW → <span style={{ color: '#DC2626' }}>{simResult.stationImpact.simulatedEnergyMargin} kW</span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                                        Fuel Burn: {simResult.stationImpact.fuelConsumptionDeltaPercent}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Asset Level Risk Comparison */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                  <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>BASELINE ASSET RISK</div>
                                      <div style={{ fontSize: '18px', fontWeight: 800, color: riskColors[simResult.baseline.riskLevel] }}>{simResult.baseline.riskLevel}</div>
                                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Fail Prob: {Math.round(simResult.baseline.failureProbability * 100)}%</div>
                                  </div>
                                  <div style={{ backgroundColor: '#EFF6FF', padding: '14px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginBottom: '4px' }}>SIMULATED ASSET RISK</div>
                                      <div style={{ fontSize: '18px', fontWeight: 800, color: riskColors[simResult.simulation.riskLevel] }}>{simResult.simulation.riskLevel}</div>
                                      <div style={{ fontSize: '12px', color: '#2563EB', marginTop: '2px' }}>Fail Prob: {Math.round(simResult.simulation.failureProbability * 100)}%</div>
                                  </div>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E3448', marginBottom: '14px', backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FECACA', display: 'inline-block' }}>
                                  Asset Risk Delta: <span style={{ color: '#DC2626', fontWeight: 800 }}>+{Math.round(simResult.change.riskIncrease * 100)}%</span>
                              </div>
                              {simResult.cascade?.cascadeRisks?.length > 0 && (
                                  <div style={{ fontSize: '14px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                      <strong style={{ color: '#1E3448', display: 'block', marginBottom: '6px' }}>Downstream Cascade Risk:</strong>
                                      {simResult.cascade.cascadeRisks.map(r => (
                                          <div key={r.assetId} style={{ marginTop: '4px', paddingLeft: '10px', borderLeft: '3px solid #CBD5E1', fontSize: '13px' }}>
                                              {r.assetId} → <span style={{ color: riskColors[r.level], fontWeight: 800 }}>{r.level}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}
            </div>
          )}

          {/* Telemetry Chart */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1E3448', marginBottom: '12px' }}>
              Recent Telemetry (24h)
            </h3>
            {telLoading ? (
              <div style={{
                height: '160px', backgroundColor: '#F6FAFD', borderRadius: '10px',
                border: '1px solid #D8E7F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color: '#64748B',
              }}>
                Loading...
              </div>
            ) : telemetry.length > 0 ? (
              <div style={{ height: '200px' }}>
                <TelemetryChart
                  data={telemetry}
                  dataKey={isGen ? 'power' : 'temp'}
                  color={isGen ? '#2563EB' : '#DC2626'}
                  hideTitle
                />
              </div>
            ) : (
              <div style={{
                height: '100px', backgroundColor: '#F6FAFD', borderRadius: '10px',
                border: '1px dashed #D8E7F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color: '#64748B',
              }}>
                No telemetry data
              </div>
            )}
          </div>

          {/* Station Spares & Maintenance Logistics */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #D8E7F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={16} color="#2563EB" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E3448', margin: 0 }}>
                  Station Spares & Field Logistics
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                {spares.length} item{spares.length === 1 ? '' : 's'} on site
              </span>
            </div>

            {sparesLoading ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                Checking station storage inventory…
              </div>
            ) : spares.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {spares.map((sp, idx) => {
                  const isLow = sp.status === 'LOW' || sp.quantityOnHand <= sp.minThreshold;
                  return (
                    <div key={idx} style={{
                      backgroundColor: '#F8FAFC', border: `1px solid ${isLow ? '#FDE68A' : '#E2E8F0'}`,
                      borderRadius: '8px', padding: '10px 12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E3448' }}>{sp.name}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                          backgroundColor: isLow ? '#FFFBEB' : '#F0FDF4', color: isLow ? '#B45309' : '#16A34A',
                          border: `1px solid ${isLow ? '#FDE68A' : '#BBF7D0'}`
                        }}>
                          {sp.quantityOnHand} {sp.unit} ({isLow ? 'LOW' : 'OK'})
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <span>SKU: {sp.partNumber}</span>
                        <span>Location: {sp.location}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#64748B' }}>
                Standard polar workshop spares and consumables apply to this equipment.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
