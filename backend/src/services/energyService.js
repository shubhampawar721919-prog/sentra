/**
 * energyService.js
 * 
 * Deterministic Energy Intelligence for Antarctic Station Operations.
 * Computes station-level generation, dynamic thermal/operational demand,
 * reserve margins, and 6h/12h/24h predictive operational forecasts.
 */

// Configurable operational baselines
const CONSTANTS = {
    BASE_ELECTRICAL_DEMAND_KW: 320.0, // Base life support, labs, communication, lighting
    BASE_HEATING_DEMAND_KW: 60.0,     // Nominal heating at benign temperatures (-10°C)
    THERMAL_STRESS_COEFFICIENT: 1.25, // Extra thermal demand scaling with environmental stress
    NOMINAL_MARGIN_KW: 80.0           // Target energy safety margin in kW
};

/**
 * Calculates current energy balance and operational margins.
 * @param {Array} generatorTelemetries - Array of latest generator telemetry docs [{ powerOutput, generatorLoad, ... }]
 * @param {number} environmentalStressFactor - Float in range [0.0, 1.0] from environmentalService
 * @param {Array} historicalGeneratorTelemetry - Array of historical telemetry for trend & forecast
 */
function evaluateEnergy(generatorTelemetries, environmentalStressFactor = 0.5, historicalGeneratorTelemetry = []) {
    // 1. Current Generation (sum of all running generators)
    let currentGeneration = 0;
    if (Array.isArray(generatorTelemetries)) {
        for (const gen of generatorTelemetries) {
            currentGeneration += Number(gen.powerOutput || 0);
        }
    }
    // Fallback if no generators running/reporting
    if (currentGeneration <= 0 && generatorTelemetries?.[0]?.powerOutput !== undefined) {
        currentGeneration = Number(generatorTelemetries[0].powerOutput);
    }
    currentGeneration = Math.round(currentGeneration);

    // 2. Dynamic Demand Calculation
    // Demand increases as environmental stress rises
    const thermalLoad = Math.round(CONSTANTS.BASE_HEATING_DEMAND_KW * (1 + environmentalStressFactor * CONSTANTS.THERMAL_STRESS_COEFFICIENT));
    const estimatedDemand = Math.round(CONSTANTS.BASE_ELECTRICAL_DEMAND_KW + thermalLoad);

    // 3. Energy Margin
    const energyMargin = currentGeneration - estimatedDemand;
    const safetyMarginPercent = estimatedDemand > 0 
        ? Number(((energyMargin / estimatedDemand) * 100).toFixed(1)) 
        : 0;

    // 4. Status determination
    let status = 'HEALTHY';
    if (energyMargin < 15) {
        status = 'DEFICIT';
    } else if (energyMargin < 50) {
        status = 'WARNING';
    }

    // 5. Energy Pillar Resilience Score (0 to 100)
    // 80+ kW margin = 100; 40 kW = 50; <= 0 kW = 0
    const energyScore = Math.max(0, Math.min(100, Math.round((energyMargin / CONSTANTS.NOMINAL_MARGIN_KW) * 100)));

    // 6. Forecast Generation (6h, 12h, 24h)
    // Uses historical 24h telemetry trend combined with diurnal temperature expectations
    const forecast = generateEnergyForecast(estimatedDemand, currentGeneration, historicalGeneratorTelemetry, environmentalStressFactor);

    return {
        currentGeneration,
        estimatedDemand,
        thermalDemand: thermalLoad,
        baseElectricalDemand: CONSTANTS.BASE_ELECTRICAL_DEMAND_KW,
        energyMargin,
        safetyMarginPercent,
        peakDemand: forecast['24h']?.expectedPeakDemand || Math.round(estimatedDemand * 1.08),
        status,
        energyScore,
        forecast
    };
}

/**
 * Transparent, explainable statistical forecasting for 6h, 12h, and 24h horizons.
 */
function generateEnergyForecast(currentDemand, currentGen, history = [], stressFactor = 0.5) {
    // Determine historical trend slope (kW change per hour over available baseline)
    let trendSlope = 0;
    if (history.length >= 6) {
        const recent = history.slice(-6);
        const first = recent[0].powerOutput || recent[0].power || currentDemand;
        const last = recent[recent.length - 1].powerOutput || recent[recent.length - 1].power || currentDemand;
        trendSlope = (last - first) / 6.0; // kW/hour drift
    }
    // Dampen slope to avoid wild runaway projections
    trendSlope = Math.max(-2.5, Math.min(2.5, trendSlope));

    // Polar diurnal cycle expected demand variations
    const h6Demand = Math.round(currentDemand + trendSlope * 6 + (stressFactor > 0.6 ? 12 : 5));
    const h12Demand = Math.round(currentDemand + trendSlope * 12 + (stressFactor > 0.6 ? 18 : 8));
    const h24Demand = Math.round(currentDemand + trendSlope * 24 + (stressFactor > 0.6 ? 8 : 0));

    const peakDemand = Math.round(Math.max(currentDemand, h6Demand, h12Demand, h24Demand) * 1.04);

    return {
        '6h': {
            expectedDemand: h6Demand,
            expectedGeneration: currentGen,
            expectedMargin: currentGen - h6Demand
        },
        '12h': {
            expectedDemand: h12Demand,
            expectedGeneration: currentGen,
            expectedMargin: currentGen - h12Demand
        },
        '24h': {
            expectedDemand: h24Demand,
            expectedGeneration: currentGen,
            expectedMargin: currentGen - h24Demand,
            expectedPeakDemand: peakDemand
        }
    };
}

module.exports = {
    CONSTANTS,
    evaluateEnergy,
    generateEnergyForecast
};
