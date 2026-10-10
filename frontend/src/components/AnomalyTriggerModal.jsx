import { useState } from 'react';
import { X, Zap, AlertTriangle, Battery, Wind, Fuel, RotateCcw, CheckCircle2, Play, Flame, Activity } from 'lucide-react';
import client from '../api/client';
import { toast } from 'react-hot-toast';

export default function AnomalyTriggerModal({ isOpen, onClose, activeStation, onTriggerSuccess }) {
  const [selectedScenario, setSelectedScenario] = useState('DG_OVERHEAT');
  const [loading, setLoading] = useState(false);
  const [customAssetId, setCustomAssetId] = useState('DG-001');
  const [customTemp, setCustomTemp] = useState(125);
  const [customVib, setCustomVib] = useState(2.85);
  const [customLoad, setCustomLoad] = useState(98);
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'

  if (!isOpen) return null;

  const isMaitri = activeStation?.code === 'MTR';
  const isMaitri2 = activeStation?.code === 'MTR2';
  const defaultDg = isMaitri2 ? 'M2-WIND-01' : isMaitri ? 'MTR-DG-01' : 'DG-001';
  const defaultBat = isMaitri2 ? 'M2-BESS-01' : isMaitri ? 'MTR-BAT-01' : 'BAT-01';
  const defaultHvac = isMaitri2 ? 'M2-HVAC-01' : isMaitri ? 'MTR-HVAC-01' : 'HVAC-01';
  const defaultFuel = isMaitri ? 'MTR-FUEL-01' : 'FUEL-01';

  const scenarios = [
    {
      id: 'DG_OVERHEAT',
      title: 'Generator Severe Overheat & Bearing Seizure',
      assetId: defaultDg,
      icon: Flame,
      color: '#DC2626',
      bg: '#FEF2F2',
      telemetry: { temperature: 128.5, vibration: 3.10, generatorLoad: 98, powerOutput: 495, coolantTemperature: 114.0 },
      description: 'Progressive mechanical bearing seizure driving core temp > 125°C and severe 3x harmonic vibrations.',
      impact: 'Triggers CRITICAL operational alert, XGBoost failure prob > 95%, and threatens 6 downstream power buses.'
    },
    {
      id: 'BAT_RUNAWAY',
      title: 'Battery Energy Storage Thermal Runaway',
      assetId: defaultBat,
      icon: Battery,
      color: '#EA580C',
      bg: '#FFF7ED',
      telemetry: { temperature: 68.0, batteryVoltage: 18.2, vibration: 0.12 },
      description: 'Thermal runaway inside polar battery cells, resulting in rapid DC bus voltage drop under high science load.',
      impact: 'Triggers HIGH risk alert, isolates energy storage float, and forces life support onto single-bus backup.'
    },
    {
      id: 'HVAC_FREEZE',
      title: 'Habitation HVAC Coil Freeze-Up',
      assetId: defaultHvac,
      icon: Wind,
      color: '#0284C7',
      bg: '#F0F9FF',
      telemetry: { temperature: -18.5, vibration: 1.45, powerOutput: 0 },
      description: 'Extreme polar blizzard thermal backdraft causing freeze-up of primary air intake heating coils.',
      impact: 'Habitation temperature drops; triggers urgent life support warning for Antarctic crew quarters.'
    },
    {
      id: 'FUEL_LEAK',
      title: 'Primary Fuel Reservoir Rapid Leak',
      assetId: defaultFuel,
      icon: Fuel,
      color: '#7C3AED',
      bg: '#F5F3FF',
      telemetry: { fuelLevel: 8.5, temperature: -28.0 },
      description: 'Pinhole rupture in heated fuel line dropping available station bulk diesel reserve below critical threshold.',
      impact: 'Autonomous station fuel runway drops from 19.2 days to < 2 days; triggers emergency conservation.'
    }
  ];

  const handleInjectPreset = async () => {
    const sc = scenarios.find(s => s.id === selectedScenario) || scenarios[0];
    setLoading(true);
    try {
      const res = await client.post('/simulation/trigger-anomaly', {
        assetId: sc.assetId,
        telemetryOverrides: sc.telemetry
      });

      toast.error(`⚠️ Critical Anomaly Injected: ${sc.title} (${sc.assetId})`, {
        duration: 5000,
        style: {
          border: '1px solid #FECACA',
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          fontWeight: 700
        }
      });

      if (onTriggerSuccess) onTriggerSuccess(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to inject anomaly');
    } finally {
      setLoading(false);
    }
  };

  const handleInjectCustom = async () => {
    setLoading(true);
    try {
      const res = await client.post('/simulation/trigger-anomaly', {
        assetId: customAssetId,
        telemetryOverrides: {
          temperature: Number(customTemp),
          vibration: Number(customVib),
          generatorLoad: Number(customLoad)
        }
      });

      toast.error(`⚠️ Custom Anomaly Injected on ${customAssetId} (T: ${customTemp}°C, Vib: ${customVib} mm/s)`, {
        duration: 5000
      });

      if (onTriggerSuccess) onTriggerSuccess(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to inject custom anomaly');
    } finally {
      setLoading(false);
    }
  };

  const handleResetNominal = async () => {
    setLoading(true);
    try {
      await client.post('/simulation/reset-nominal', {
        stationId: activeStation?._id
      });

      toast.success('✓ Equipment telemetry restored to nominal operating state. Active alerts resolved.', {
        duration: 4000,
        style: {
          border: '1px solid #BBF7D0',
          backgroundColor: '#F0FDF4',
          color: '#166534',
          fontWeight: 700
        }
      });

      if (onTriggerSuccess) onTriggerSuccess({ reset: 'nominal' });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset to nominal state');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCanonical = async () => {
    setLoading(true);
    try {
      await client.post('/simulation/reset-canonical');

      toast('🔄 Station restored to canonical Phase 11.1 degraded baseline (DG-001 @ 100.2°C).', {
        icon: 'ℹ️',
        duration: 4000
      });

      if (onTriggerSuccess) onTriggerSuccess({ reset: 'canonical' });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to restore canonical baseline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(18, 48, 74, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#12304A',
          color: '#FFFFFF',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              backgroundColor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(220,38,38,0.4)'
            }}>
              <Zap size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '0.02em', color: '#FFFFFF' }}>
                SENTRA Sensor Fault &amp; Event Injection Console
              </h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                Trigger real-time telemetry faults, evaluate ML detection & observe cascade propagation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
              padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Station Badge & Tabs */}
        <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Target Station:</span>
            <span style={{
              fontSize: '12px', fontWeight: 800, color: '#1E3448',
              backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1'
            }}>
              {activeStation?.name || 'Bharati'} ({activeStation?.code || 'BHR'})
            </span>
          </div>

          {/* Preset vs Custom Tab */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('presets')}
              style={{
                fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px',
                border: 'none', cursor: 'pointer',
                backgroundColor: activeTab === 'presets' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'presets' ? '#2563EB' : '#64748B',
                boxShadow: activeTab === 'presets' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              1-Click Scenarios
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              style={{
                fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '6px',
                border: 'none', cursor: 'pointer',
                backgroundColor: activeTab === 'custom' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'custom' ? '#2563EB' : '#64748B',
                boxShadow: activeTab === 'custom' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Custom Telemetry Tuner
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {activeTab === 'presets' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scenarios.map(sc => {
                const isSelected = selectedScenario === sc.id;
                const Icon = sc.icon;

                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    style={{
                      border: isSelected ? `2px solid ${sc.color}` : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? sc.bg : '#FFFFFF',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: `${sc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '2px'
                    }}>
                      <Icon size={18} color={sc.color} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E3448' }}>
                          {sc.title}
                        </div>
                        <span style={{
                          fontSize: '11px', fontWeight: 800, color: sc.color,
                          backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${sc.color}40`
                        }}>
                          {sc.assetId}
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 6px', lineHeight: '1.4' }}>
                        {sc.description}
                      </p>

                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>
                        ⚡ Expected Impact: {sc.impact}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Telemetry Tuner */
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Select Target Equipment Asset:
                </label>
                <select
                  value={customAssetId}
                  onChange={(e) => setCustomAssetId(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, color: '#1E3448', backgroundColor: '#FFFFFF'
                  }}
                >
                  {(isMaitri2 ? ['M2-WIND-01', 'M2-SOLAR-01', 'M2-BESS-01', 'M2-HVAC-01', 'M2-PUMP-01', 'M2-H2-01', 'M2-COM-01', 'M2-AWS-01', 'M2-HAB-01', 'M2-LAB-01'] : isMaitri ? ['MTR-DG-01', 'MTR-DG-02', 'MTR-BAT-01', 'MTR-HVAC-01', 'MTR-PUMP-01', 'MTR-FUEL-01'] : ['DG-001', 'DG-002', 'BAT-01', 'BAT-02', 'HVAC-01', 'PUMP-01', 'COM-01', 'FUEL-01']).map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  <span>Core Temperature (°C):</span>
                  <span style={{ color: customTemp > 100 ? '#DC2626' : '#2563EB' }}>{customTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={customTemp}
                  onChange={(e) => setCustomTemp(e.target.value)}
                  style={{ width: '100%', accentColor: '#DC2626' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  <span>Vibration Harmonic (mm/s RMS):</span>
                  <span style={{ color: customVib > 0.6 ? '#DC2626' : '#2563EB' }}>{customVib} mm/s</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="4.50"
                  step="0.05"
                  value={customVib}
                  onChange={(e) => setCustomVib(e.target.value)}
                  style={{ width: '100%', accentColor: '#DC2626' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  <span>Generator Electrical Load (%):</span>
                  <span style={{ color: customLoad > 90 ? '#DC2626' : '#2563EB' }}>{customLoad}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="120"
                  value={customLoad}
                  onChange={(e) => setCustomLoad(e.target.value)}
                  style={{ width: '100%', accentColor: '#2563EB' }}
                />
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={activeTab === 'presets' ? handleInjectPreset : handleInjectCustom}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <Zap size={18} />
              {loading ? 'Injecting Anomaly...' : '⚡ INJECT ANOMALY & BROADCAST'}
            </button>
          </div>

          {/* Restoration & Reset Controls */}
          <div style={{
            borderTop: '1px solid #E2E8F0', paddingTop: '14px', marginTop: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
              Testing Controls:
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleResetNominal}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', borderRadius: '8px', border: '1px solid #BBF7D0',
                  backgroundColor: '#F0FDF4', color: '#166534', fontSize: '12px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <CheckCircle2 size={14} color="#16A34A" />
                Restore Nominal (Safe)
              </button>

              <button
                onClick={handleResetCanonical}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC', color: '#334155', fontSize: '12px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <RotateCcw size={14} />
                Reset to Canonical (Phase 11.1)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
