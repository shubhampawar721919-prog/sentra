/**
 * resilienceService.js
 * 
 * Deterministic Station Resilience Scoring for POLARIS.
 * Calculates an explainable, reproducible 0-100 score reflecting the station's
 * capacity to maintain operations under combined asset risk, cascading threats,
 * energy margins, fuel reserves, and environmental stress.
 */

/**
 * Calculates the Station Resilience Score and contributing pillar breakdown.
 * @param {Object} params
 * @param {number} params.primaryRiskScore - Float [0.0, 1.0] from ML risk evaluation
 * @param {Array} params.activeAlerts - Array of active Alert documents
 * @param {Array} params.cascadeAffectedAssets - Array of assetIds threatened downstream
 * @param {number} params.energyMargin - Available energy margin in kW
 * @param {number} params.energyScore - Energy pillar score [0, 100]
 * @param {number} params.fuelDaysRemaining - Estimated fuel runtime in days
 * @param {number} params.fuelScore - Fuel pillar score [0, 100]
 * @param {number} params.environmentalStress - Environmental stress factor [0.0, 1.0]
 * @param {number} params.environmentalScore - Environmental pillar score [0, 100]
 */
function calculateStationResilience({
    primaryRiskScore = 0.2,
    activeAlerts = [],
    cascadeAffectedAssets = [],
    energyMargin = 60,
    energyScore = 75,
    fuelDaysRemaining = 18,
    fuelScore = 72,
    environmentalStress = 0.5,
    environmentalScore = 65
}) {
    let penalty = 0;
    const penaltyAudit = [];

    // 1. Asset Health & Alert Penalties
    let alertPenalty = 0;
    for (const alert of activeAlerts) {
        if (alert.severity === 'CRITICAL') alertPenalty += 16;
        else if (alert.severity === 'HIGH') alertPenalty += 8;
        else if (alert.severity === 'MEDIUM') alertPenalty += 3;
        else alertPenalty += 1;
    }
    // Cap alert penalty at 35
    alertPenalty = Math.min(35, alertPenalty);
    penalty += alertPenalty;
    if (alertPenalty > 0) penaltyAudit.push({ factor: 'Active Alerts', penalty: alertPenalty });

    // Primary asset risk penalty (up to 20 points)
    const assetRiskPenalty = Math.round(Math.min(1.0, Math.max(0, primaryRiskScore)) * 20);
    penalty += assetRiskPenalty;
    if (assetRiskPenalty > 0) penaltyAudit.push({ factor: 'Primary Asset Risk', penalty: assetRiskPenalty });

    // Pillar: Asset Health (100 minus combined asset & alert penalties)
    const assetHealthScore = Math.max(0, Math.min(100, 100 - (alertPenalty + assetRiskPenalty)));

    // 2. Cascade Exposure Penalty (up to 20 points)
    const threatenedCount = Array.isArray(cascadeAffectedAssets) ? cascadeAffectedAssets.length : 0;
    const cascadePenalty = Math.min(20, threatenedCount * 5);
    penalty += cascadePenalty;
    if (cascadePenalty > 0) penaltyAudit.push({ factor: 'Downstream Cascade Risk', penalty: cascadePenalty });

    // Pillar: Cascade Exposure
    const cascadeExposureScore = Math.max(0, Math.min(100, 100 - cascadePenalty * 4));

    // 3. Energy Margin Penalty (up to 30 points)
    let energyPenalty = 0;
    if (energyMargin < 0) {
        energyPenalty = 30;
    } else if (energyMargin < 30) {
        energyPenalty = 16;
    } else if (energyMargin < 60) {
        energyPenalty = 7;
    }
    penalty += energyPenalty;
    if (energyPenalty > 0) penaltyAudit.push({ factor: 'Energy Margin Deficit', penalty: energyPenalty });

    // 4. Fuel Reserve Penalty (up to 25 points)
    let fuelPenalty = 0;
    if (fuelDaysRemaining < 7) {
        fuelPenalty = 25;
    } else if (fuelDaysRemaining < 14) {
        fuelPenalty = 14;
    } else if (fuelDaysRemaining < 20) {
        fuelPenalty = 5;
    }
    penalty += fuelPenalty;
    if (fuelPenalty > 0) penaltyAudit.push({ factor: 'Low Fuel Reserve', penalty: fuelPenalty });

    // 5. Environmental Stress Penalty (up to 10 points)
    let envPenalty = 0;
    if (environmentalStress >= 0.60) {
        envPenalty = 9; // Severe Cold
    } else if (environmentalStress >= 0.30) {
        envPenalty = 4; // Cold Stress
    }
    penalty += envPenalty;
    if (envPenalty > 0) penaltyAudit.push({ factor: 'Polar Weather Stress', penalty: envPenalty });

    // Compute final Resilience Score clamped to [0, 100]
    const resilienceScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    // Categorization
    let resilienceStatus = 'ROBUST';
    if (resilienceScore < 40) {
        resilienceStatus = 'CRITICAL';
    } else if (resilienceScore < 60) {
        resilienceStatus = 'VULNERABLE';
    } else if (resilienceScore < 80) {
        resilienceStatus = 'STABLE';
    }

    // High-level Station Operational Status
    const hasCriticalAlert = activeAlerts.some(a => a.severity === 'CRITICAL');
    const hasHighAlert = activeAlerts.some(a => a.severity === 'HIGH');

    let operationalStatus = 'ONLINE';
    if (resilienceScore < 20) {
        operationalStatus = 'OFFLINE';
    } else if (hasCriticalAlert || hasHighAlert || resilienceScore < 80) {
        operationalStatus = 'DEGRADED';
    }

    return {
        score: resilienceScore,
        status: resilienceStatus,
        operationalStatus: operationalStatus,
        breakdown: {
            assetHealth: assetHealthScore,
            energyMargin: energyScore,
            fuelReserve: fuelScore,
            environment: environmentalScore,
            cascadeExposure: cascadeExposureScore
        },
        penaltyAudit: penaltyAudit
    };
}

module.exports = {
    calculateStationResilience
};
