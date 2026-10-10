/**
 * environmentalService.js
 * 
 * Deterministic Environmental Intelligence for Antarctic Station Operations.
 * Translates external weather conditions (temperature, pressure, humidity)
 * into operational stress classifications and downstream thermal load impacts.
 */

// Configurable operational thresholds
const THRESHOLDS = {
    NORMAL_MAX: -15.0,     // Temperatures above -15°C are considered normal Antarctic operational range
    COLD_STRESS_MIN: -30.0 // Below -30°C triggers Severe Cold protocol
};

/**
 * Classifies environmental condition based on external ambient temperature.
 * @param {number} temp - External temperature in °C
 * @returns {string} 'NORMAL' | 'COLD STRESS' | 'SEVERE COLD'
 */
function classifyCondition(temp) {
    if (temp > THRESHOLDS.NORMAL_MAX) return 'NORMAL';
    if (temp >= THRESHOLDS.COLD_STRESS_MIN) return 'COLD STRESS';
    return 'SEVERE COLD';
}

/**
 * Calculates a continuous environmental stress factor between 0.0 (benign) and 1.0 (extreme polar stress).
 * @param {number} temp - External temperature in °C
 * @returns {number} Float in range [0.0, 1.0]
 */
function calculateStressFactor(temp) {
    if (temp >= 0) return 0.0;
    if (temp > THRESHOLDS.NORMAL_MAX) {
        // 0°C to -15°C: 0.0 -> 0.20
        return Number(((-temp / 15.0) * 0.20).toFixed(2));
    }
    if (temp >= THRESHOLDS.COLD_STRESS_MIN) {
        // -15°C to -30°C: 0.20 -> 0.60
        const progress = (-temp - 15.0) / 15.0;
        return Number((0.20 + progress * 0.40).toFixed(2));
    }
    // Below -30°C: 0.60 -> 1.00
    const severeProgress = (-temp - 30.0) / 20.0;
    return Number(Math.min(1.0, 0.60 + severeProgress * 0.40).toFixed(2));
}

/**
 * Generates an environmental intelligence summary for a station.
 * @param {Object} latestWeatherTelemetry - { temperature, pressure, humidity }
 */
function evaluateEnvironment(latestWeatherTelemetry) {
    const temp = latestWeatherTelemetry?.temperature ?? -28.5;
    const pressure = latestWeatherTelemetry?.pressure ?? 985;
    const humidity = latestWeatherTelemetry?.humidity ?? 65;

    const condition = classifyCondition(temp);
    const stressFactor = calculateStressFactor(temp);

    let stressLevel = 'LOW';
    if (stressFactor >= 0.60) stressLevel = 'HIGH';
    else if (stressFactor >= 0.20) stressLevel = 'MODERATE';

    // Thermal demand multiplier over base heating
    const heatingDeltaPercent = Math.round(stressFactor * 65); // 0% to +65% extra heating
    const impactSummary = `Heating demand ↑ (+${heatingDeltaPercent}%) · Generator load ↑ · Energy margin ↓`;

    // 0-100 score for station resilience contribution (100 = minimal stress, 0 = extreme stress)
    const environmentalScore = Math.max(0, Math.min(100, Math.round((1 - stressFactor) * 100)));

    return {
        temperature: temp,
        pressure: pressure,
        humidity: humidity,
        condition: condition,
        stressFactor: stressFactor,
        stressLevel: stressLevel,
        heatingDeltaPercent: heatingDeltaPercent,
        impactSummary: impactSummary,
        environmentalScore: environmentalScore
    };
}

module.exports = {
    THRESHOLDS,
    classifyCondition,
    calculateStressFactor,
    evaluateEnvironment
};
