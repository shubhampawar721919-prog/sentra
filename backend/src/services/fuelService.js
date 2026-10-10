/**
 * fuelService.js
 * 
 * Deterministic Fuel Intelligence & Depletion Projection for Antarctic Operations.
 * Calculates current reserves, empirical consumption slopes from historical telemetry,
 * remaining runtime projections, and cold-weather scenario modelling.
 */

const CONSTANTS = {
    DEFAULT_CAPACITY_LITRES: 50000, // 50,000 Liter primary reservoir
    DEFAULT_DAILY_CONSUMPTION_RATE: 4.1, // 4.1% per day under nominal generator load
    SEVERE_COLD_CONSUMPTION_MULTIPLIER: 1.25 // +25% consumption during severe polar storms
};

/**
 * Evaluates fuel reserves, consumption trends, and runtime depletion projections.
 * @param {Object} latestFuelTelemetry - { fuelLevel, timestamp }
 * @param {Array} historicalFuelTelemetry - Array of telemetry docs over 12-24h
 * @param {number} environmentalStressFactor - Stress factor [0.0, 1.0]
 */
function evaluateFuel(latestFuelTelemetry, historicalFuelTelemetry = [], environmentalStressFactor = 0.5) {
    const currentLevel = Number(latestFuelTelemetry?.fuelLevel ?? 73.2);
    const capacityLitres = CONSTANTS.DEFAULT_CAPACITY_LITRES;
    const currentLitres = Math.round((currentLevel / 100.0) * capacityLitres);

    // Calculate empirical consumption rate from historical telemetry slope
    let consumptionRatePercentPerDay = CONSTANTS.DEFAULT_DAILY_CONSUMPTION_RATE;

    if (Array.isArray(historicalFuelTelemetry) && historicalFuelTelemetry.length >= 4) {
        const oldest = historicalFuelTelemetry[0];
        const newest = historicalFuelTelemetry[historicalFuelTelemetry.length - 1];
        
        const deltaHours = Math.max(1, (new Date(newest.timestamp) - new Date(oldest.timestamp)) / 3600000);
        const deltaFuel = (oldest.fuelLevel || 0) - (newest.fuelLevel || 0);

        if (deltaFuel > 0 && deltaHours > 0) {
            const calculatedRate = (deltaFuel / deltaHours) * 24.0;
            // Bound rate within physical engineering limits (2.0% to 8.0% per day)
            if (calculatedRate >= 2.0 && calculatedRate <= 8.0) {
                consumptionRatePercentPerDay = Number(calculatedRate.toFixed(1));
            }
        }
    }

    // Remaining runtime under currently active conditions
    const remainingRuntimeDays = Number((currentLevel / consumptionRatePercentPerDay).toFixed(1));

    // Projected Depletion Date
    const now = Date.now();
    const projectedDepletionDate = new Date(now + remainingRuntimeDays * 86400000).toISOString();

    // Consumption Trend Indicator
    let consumptionTrend = 'STABLE';
    if (environmentalStressFactor > 0.6) {
        consumptionTrend = 'INCREASING';
    } else if (environmentalStressFactor < 0.2) {
        consumptionTrend = 'DECREASING';
    }

    // Status
    let status = 'HEALTHY';
    if (remainingRuntimeDays < 10) {
        status = 'CRITICAL';
    } else if (remainingRuntimeDays < 20) {
        status = 'WARNING';
    }

    // Fuel Pillar Score for Resilience (0-100)
    // 25+ days = 100; 12.5 days = 50; 0 days = 0
    const fuelScore = Math.max(0, Math.min(100, Math.round((remainingRuntimeDays / 25.0) * 100)));

    // Scenario Comparisons (Modelled Projections)
    const normalBurnRate = consumptionRatePercentPerDay;
    const normalDays = Number((currentLevel / normalBurnRate).toFixed(1));

    const severeBurnRate = Number((consumptionRatePercentPerDay * CONSTANTS.SEVERE_COLD_CONSUMPTION_MULTIPLIER).toFixed(1));
    const severeDays = Number((currentLevel / severeBurnRate).toFixed(1));
    const deltaDays = Number((normalDays - severeDays).toFixed(1));

    return {
        level: currentLevel,
        currentLitres: currentLitres,
        capacityLitres: capacityLitres,
        consumptionRatePercentPerDay: consumptionRatePercentPerDay,
        consumptionRateLitresPerHour: Math.round((consumptionRatePercentPerDay / 24.0 / 100.0) * capacityLitres),
        remainingRuntimeDays: remainingRuntimeDays,
        projectedDepletionDate: projectedDepletionDate,
        consumptionTrend: consumptionTrend,
        status: status,
        fuelScore: fuelScore,
        scenarios: {
            normal: {
                condition: 'Normal Polar Operation',
                burnRatePercentPerDay: normalBurnRate,
                estimatedRemainingDays: normalDays
            },
            severeCold: {
                condition: 'Severe Cold Storm Scenario',
                burnRatePercentPerDay: severeBurnRate,
                estimatedRemainingDays: severeDays,
                reductionDays: deltaDays
            }
        }
    };
}

module.exports = {
    CONSTANTS,
    evaluateFuel
};
