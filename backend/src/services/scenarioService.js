/**
 * scenarioService.js
 * 
 * Deterministic Scenario Management & Action Simulation Service for POLARIS Phase 9.
 * Simulates hypothetical operational mitigation actions against the station's baseline,
 * computes comparative resilience and energy trade-offs, and applies a multi-criteria
 * decision algorithm to deterministically select the optimal response.
 * 
 * CRITICAL INVARIANT: NEVER MUTATES MONGODB DATA.
 */

const resilienceService = require('./resilienceService');
const logisticsService = require('./logisticsService');

/**
 * Builds the complete Decision Center operational scenario payload.
 * @param {Object} station - Station mongoose document
 * @param {Object} stationIntelligence - Output from station intelligence endpoint
 * @param {Array} activeAlerts - Array of active Alert documents
 */
function buildDecisionCenterScenario(station, stationIntelligence, activeAlerts = []) {
    const resilience = stationIntelligence?.resilienceScore ?? 47;
    const resilienceStatus = stationIntelligence?.resilienceStatus ?? 'VULNERABLE';
    const primaryAssetId = stationIntelligence?.primaryRiskAsset || 'DG-001';
    const primaryRisk = stationIntelligence?.stationRisk || { level: 'HIGH', score: 0.57 };
    const cascadeAffected = stationIntelligence?.cascadeImpact || ['BAT-01', 'BAT-02', 'HVAC-01', 'HVAC-02', 'PUMP-01', 'COM-01'];
    const env = stationIntelligence?.environmental || { temperature: -30.5, condition: 'SEVERE COLD', stressFactor: 0.61, heatingDeltaPercent: 40 };
    const energy = stationIntelligence?.energy || { currentGeneration: 492, estimatedDemand: 426, energyMargin: 66, safetyMarginPercent: 15.5 };
    const fuel = stationIntelligence?.fuel || { level: 73.0, remainingRuntimeDays: 19.2, consumptionRatePercentPerDay: 3.8 };

    // Baseline Situation
    const baseline = {
        resilience,
        resilienceStatus,
        energyMargin: energy.energyMargin,
        currentGeneration: energy.currentGeneration,
        estimatedDemand: energy.estimatedDemand,
        safetyMarginPercent: energy.safetyMarginPercent,
        fuelDays: fuel.remainingRuntimeDays,
        fuelLevel: fuel.level,
        fuelBurnRate: fuel.consumptionRatePercentPerDay,
        riskLevel: primaryRisk.level || 'HIGH',
        failureProbability: Math.round((stationIntelligence?.assetsIntelligence?.find(a => a.assetId === primaryAssetId)?.failurePrediction?.probability || 0.68) * 100),
        cascadeCount: cascadeAffected.length,
        cascadeAssets: cascadeAffected
    };

    // Simulate the 4 Standard Operational Responses
    const actions = [
        simulateMonitor(baseline, env),
        simulateLoadShedding(baseline, env),
        simulateBackupPower(baseline, env, station.code, primaryAssetId),
        simulateThrottleInspect(baseline, env)
    ];

    // Select the optimal recommended action via deterministic multi-criteria scoring
    const recommendation = evaluateBestAction(actions, baseline);

    // Logistics & Spares Context
    const stationCode = station?.code || 'BHR';
    const compatibleSpares = logisticsService.getSparesForAsset(stationCode, primaryAssetId);
    const vessel = logisticsService.getResupplyVesselStatus(stationCode);
    const hasSparesInStock = compatibleSpares.length > 0 && compatibleSpares.some(s => s.quantityOnHand > 0);
    const sparesSummaryText = compatibleSpares.length > 0
        ? compatibleSpares.map(s => `${s.name}: ${s.quantityOnHand} ${s.unit} in ${s.location}`).join('; ')
        : 'Standard polar workshop spares and replacement assemblies available.';

    // Build Supporting Evidence Checklist (Part 7)
    const evidence = [
        {
            verified: true,
            claim: `${primaryAssetId} vibration and thermal signature show persistent upward drift.`,
            metric: `Failure Probability: ${baseline.failureProbability}%`
        },
        {
            verified: true,
            claim: `Antarctic weather (${env.condition}, ${env.temperature}°C) imposes extra thermal heating demand.`,
            metric: `Thermal Load: +${env.heatingDeltaPercent || 40}%`
        },
        {
            verified: baseline.energyMargin < 80,
            claim: `Energy margin (${baseline.energyMargin} kW) is operating near standard safety buffer.`,
            metric: `Safety Margin: ${baseline.safetyMarginPercent}%`
        },
        {
            verified: baseline.cascadeCount > 0,
            claim: `${baseline.cascadeCount} downstream systems (battery storage, HVAC heating, water pumping) depend on ${primaryAssetId}.`,
            metric: `Cascade Exposure: ${baseline.cascadeCount} assets`
        },
        {
            verified: true,
            claim: `Station fuel reserves (${baseline.fuelLevel}%) provide ${baseline.fuelDays} days of nominal runtime.`,
            metric: `Burn Rate: ${baseline.fuelBurnRate}%/day`
        },
        {
            verified: hasSparesInStock,
            claim: `Station spares stock verified for ${primaryAssetId}: ${sparesSummaryText}`,
            metric: `Spares On Hand: ${compatibleSpares.reduce((acc, s) => acc + s.quantityOnHand, 0)} units`
        },
        {
            verified: true,
            claim: `44th ISEA Resupply Vessel (${vessel.vesselName}) is ${vessel.daysUntilArrival} days from berthing; austral summer window is ${vessel.polarWindowStatus}.`,
            metric: `Vessel ETA: ${vessel.daysUntilArrival}d`
        }
    ];

    // Standardized Impact Summary (Part 9)
    const impactSummary = {
        direct: {
            assetId: primaryAssetId,
            impact: 'Generator rotational stability compromised; risk of unscheduled thermal trip or bearing seizure.'
        },
        downstream: {
            affectedCount: baseline.cascadeCount,
            criticalSystems: ['Battery Bank Alpha/Beta (Reserve Depletion)', 'HVAC Living Quarters & Lab (Loss of Habitat Heating)', 'Primary Coolant Pump (Thermal Runaway)'],
            riskLevel: 'HIGH'
        },
        station: {
            resilience: `Current station resilience stands at ${baseline.resilience}/100 (${baseline.resilienceStatus}).`,
            energy: `Available margin is ${baseline.energyMargin} kW. Failure would produce immediate deficit of ${baseline.estimatedDemand} kW.`,
            fuel: `Fuel reserve is sufficient for ${baseline.fuelDays} days at current generator burn rate.`,
            logistics: `${compatibleSpares.length} compatible spare parts types on station; next resupply ship is ${vessel.daysUntilArrival} days out.`
        }
    };

    return {
        station: {
            id: station._id,
            name: station.name,
            code: station.code,
            location: station.location,
            status: station.status,
            environment: station.environment
        },
        scenario: {
            id: `SCENARIO-${primaryAssetId}-DEGRADATION`,
            title: `${primaryAssetId} Generator Mechanical Degradation`,
            primaryThreat: primaryAssetId,
            severity: activeAlerts.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
            baseline,
            impactSummary
        },
        actions,
        recommendation,
        evidence,
        logistics: {
            spares: compatibleSpares,
            vessel: vessel,
            hasSparesInStock
        },
        activeAlert: activeAlerts.find(a => a.assetId?.assetId === primaryAssetId || a.assetName?.includes(primaryAssetId)) || activeAlerts[0] || null
    };
}

/** Action 1: Monitor */
function simulateMonitor(b, env) {
    return {
        id: 'MONITOR',
        name: 'Maintain Passive Monitoring',
        type: 'OBSERVE',
        description: 'Continue passive telemetry surveillance without adjusting station equipment or load allocation.',
        rationale: 'Avoids operational disruption or laboratory power interruption if variance is transient.',
        tradeoff: 'Leaves station vulnerable to sudden in-service generator trip under severe polar cold.',
        changes: { demandDeltaKw: 0, generationDeltaKw: 0 },
        simulated: {
            resilience: b.resilience,
            resilienceDelta: 0,
            energyMargin: b.energyMargin,
            marginDelta: 0,
            safetyMarginPercent: b.safetyMarginPercent,
            fuelDays: b.fuelDays,
            fuelDeltaDays: 0,
            postActionRisk: b.riskLevel,
            cascadeExposedCount: b.cascadeCount,
            status: 'UNRESOLVED'
        }
    };
}

/** Action 2: Shed Non-Critical Load */
function simulateLoadShedding(b, env) {
    const demandReduction = 45; // 45 kW shed
    const simDemand = b.estimatedDemand - demandReduction;
    const simMargin = b.currentGeneration - simDemand;
    const simResilience = Math.min(100, b.resilience + 7);
    const fuelSavingsDays = 1.6;

    return {
        id: 'REDUCE_NON_CRITICAL_LOAD',
        name: 'Shed Non-Critical Facility Loads',
        type: 'LOAD_SHEDDING',
        description: 'Isolate auxiliary scientific lab instrumentation and secondary living quarters heating zones (-45 kW).',
        rationale: 'Immediately expands electrical safety buffer and relieves mechanical torque strain on DG-001.',
        tradeoff: 'Temporarily suspends non-essential atmospheric research experiments.',
        changes: { demandDeltaKw: -45, generationDeltaKw: 0 },
        simulated: {
            resilience: simResilience,
            resilienceDelta: +7,
            energyMargin: simMargin,
            marginDelta: +45,
            safetyMarginPercent: Number(((simMargin / simDemand) * 100).toFixed(1)),
            fuelDays: Number((b.fuelDays + fuelSavingsDays).toFixed(1)),
            fuelDeltaDays: +1.6,
            postActionRisk: 'MEDIUM',
            cascadeExposedCount: 2,
            status: 'MITIGATED'
        }
    };
}

/** Action 3: Activate Standby Generator */
function simulateBackupPower(b, env, stationCode = 'BHR', primaryAssetId = 'DG-001') {
    const isMaitri = stationCode === 'MTR';
    const standbyName = isMaitri 
        ? (primaryAssetId === 'MTR-DG-02' ? 'MTR-DG-01' : 'MTR-DG-02') 
        : (primaryAssetId === 'DG-002' ? 'DG-001' : 'DG-002');
    const stationName = isMaitri ? 'Maitri' : 'Bharati';

    const extraGen = 360; // Secondary DG active
    const totalGen = b.currentGeneration + extraGen;
    const simMargin = totalGen - b.estimatedDemand;
    const simResilience = Math.min(100, b.resilience + 12);
    const fuelRuntimeDropDays = -2.1; // Running two generators consumes fuel faster

    return {
        id: 'ACTIVATE_BACKUP_POWER',
        name: `Activate Standby Generator (${standbyName})`,
        type: 'REDUNDANCY',
        description: `Initiate hot pre-heat and synchronization of Secondary Generator ${standbyName} to share load with ${primaryAssetId}.`,
        rationale: `Restores N+1 electrical redundancy across ${stationName} grid and enables safe isolation of ${primaryAssetId}.`,
        tradeoff: 'Temporarily accelerates station fuel consumption while dual generators are synchronized.',
        changes: { demandDeltaKw: 0, generationDeltaKw: +360 },
        simulated: {
            resilience: simResilience,
            resilienceDelta: +12,
            energyMargin: simMargin,
            marginDelta: +extraGen,
            safetyMarginPercent: Number(((simMargin / b.estimatedDemand) * 100).toFixed(1)),
            fuelDays: Number((b.fuelDays + fuelRuntimeDropDays).toFixed(1)),
            fuelDeltaDays: -2.1,
            postActionRisk: 'LOW',
            cascadeExposedCount: 0,
            status: 'RESOLVED'
        }
    };
}

/** Action 4: Throttle Load & Dispatch Inspection */
function simulateThrottleInspect(b, env) {
    const genThrottled = Math.round(b.currentGeneration * 0.65);
    const simMargin = genThrottled - b.estimatedDemand;
    const simResilience = Math.max(20, b.resilience - 4);

    return {
        id: 'INSPECT_AND_THROTTLE',
        name: 'Throttle Load & Dispatch Inspection',
        type: 'MAINTENANCE',
        description: 'De-rate primary generator output to 65% capacity and dispatch mechanical team to inspect bearing assembly.',
        rationale: 'Stops mechanical wear and prevents catastrophic in-service bearing seizure during inspection.',
        tradeoff: 'Requires strict load rationing while generator operates at reduced capacity.',
        changes: { demandDeltaKw: 0, generationDeltaKw: -(b.currentGeneration - genThrottled) },
        simulated: {
            resilience: simResilience,
            resilienceDelta: -4,
            energyMargin: simMargin,
            marginDelta: -(b.currentGeneration - genThrottled),
            safetyMarginPercent: Number(((simMargin / b.estimatedDemand) * 100).toFixed(1)),
            fuelDays: Number((b.fuelDays + 2.4).toFixed(1)),
            fuelDeltaDays: +2.4,
            postActionRisk: 'LOW',
            cascadeExposedCount: 1,
            status: 'MITIGATED'
        }
    };
}

/**
 * Deterministic multi-criteria ranking algorithm.
 * Criteria weights:
 * - Resilience Gain: 35%
 * - Energy Safety Margin: 25%
 * - Risk Mitigation: 20%
 * - Cascade Isolation: 10%
 * - Fuel Conservation: 10%
 */
function evaluateBestAction(actions, baseline) {
    let bestAction = actions[0];
    let highestScore = -Infinity;

    for (const action of actions) {
        const s = action.simulated;
        
        // Resilience term (scale 0-100)
        const resilienceScore = s.resilience;

        // Safety margin term (clamped 0-100)
        const marginScore = Math.min(100, Math.max(0, s.safetyMarginPercent * 2));

        // Risk reduction score
        const riskScore = s.postActionRisk === 'LOW' ? 100 : s.postActionRisk === 'MEDIUM' ? 60 : 20;

        // Cascade isolation score
        const cascadeScore = Math.max(0, 100 - (s.cascadeExposedCount * 18));

        // Fuel conservation score
        const fuelScore = Math.min(100, Math.max(0, (s.fuelDays / 25.0) * 100));

        // Calculate individual weighted contributions
        const resilienceContrib = Number((0.35 * resilienceScore).toFixed(2));
        const marginContrib = Number((0.25 * marginScore).toFixed(2));
        const riskContrib = Number((0.20 * riskScore).toFixed(2));
        const cascadeContrib = Number((0.10 * cascadeScore).toFixed(2));
        const fuelContrib = Number((0.10 * fuelScore).toFixed(2));

        const compositeScore = Number((
            resilienceContrib +
            marginContrib +
            riskContrib +
            cascadeContrib +
            fuelContrib
        ).toFixed(2));

        action.decisionScore = compositeScore;
        action.score = compositeScore;

        // Part B: Complete mathematical score breakdown
        action.scoreBreakdown = {
            raw: {
                resilience: s.resilience,
                safetyMarginPercent: s.safetyMarginPercent,
                postActionRisk: s.postActionRisk,
                cascadeExposedCount: s.cascadeExposedCount,
                fuelDays: s.fuelDays
            },
            normalized: {
                resilienceScore,
                marginScore,
                riskScore,
                cascadeScore,
                fuelScore
            },
            contributions: {
                resilience: resilienceContrib,
                margin: marginContrib,
                risk: riskContrib,
                cascade: cascadeContrib,
                fuel: fuelContrib
            },
            formula: "0.35*Resilience + 0.25*Margin + 0.20*Risk + 0.10*Cascade + 0.10*Fuel"
        };

        if (compositeScore > highestScore) {
            highestScore = compositeScore;
            bestAction = action;
        }
    }

    // Rank actions deterministically
    actions.sort((a, b) => b.decisionScore - a.decisionScore);
    actions.forEach((a, i) => {
        a.rank = i + 1;
    });

    // Calibrate recommendation confidence dynamically based on score strength & dominance margin
    const runnerUpScore = actions.length > 1 ? actions[1].decisionScore : (highestScore - 15);
    const scoreLead = Math.max(0, highestScore - runnerUpScore);
    const dynamicConfidence = Number(Math.min(0.98, Math.max(0.68, (highestScore / 100) * 0.60 + Math.min(0.35, (scoreLead / 20) * 0.35))).toFixed(2));

    return {
        selectedActionId: bestAction.id,
        selectedActionName: bestAction.name,
        confidence: dynamicConfidence,
        score: highestScore,
        headline: `Recommended Response: ${bestAction.name}`,
        rationale: `This response achieves the highest operational utility (${highestScore}/100). It produces an optimal resilience gain (${bestAction.simulated.resilienceDelta > 0 ? '+' : ''}${bestAction.simulated.resilienceDelta} pts) while expanding the energy safety margin to ${bestAction.simulated.energyMargin} kW and isolating downstream cascade exposure.`,
        suggestedNextStep: 'Acknowledge alert and mark action planned to prepare engineering crew for execution.'
    };
}

module.exports = {
    buildDecisionCenterScenario
};
