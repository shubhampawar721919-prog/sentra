const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const getMlUrl = () => process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 8000; // 8 second timeout

async function getUnifiedIntelligence(assetId, telemetryData) {
    try {
        const payload = {
            assetId: assetId,
            temperature: telemetryData.temperature || 0,
            vibration: telemetryData.vibration || 0,
            powerOutput: telemetryData.powerOutput || 0,
            generatorLoad: telemetryData.generatorLoad || 0,
            fuelLevel: telemetryData.fuelLevel || 0,
            coolantTemperature: telemetryData.coolantTemperature || 0,
            batteryVoltage: telemetryData.batteryVoltage || 0
        };

        const response = await axios.post(`${getMlUrl()}/unified-intelligence`, payload, {
            timeout: TIMEOUT_MS
        });
        
        return response.data;
    } catch (error) {
        console.error(`[ML] Request to /unified-intelligence failed for asset ${assetId}:`, error.message);
        return {
            status: "UNAVAILABLE",
            message: "ML intelligence service unavailable."
        };
    }
}

async function runSimulation(assetId, baselineTelemetry, changes) {
    try {
        const payload = {
            assetId: assetId,
            baseline: {
                assetId: assetId,
                temperature: baselineTelemetry.temperature || 80.0,
                vibration: baselineTelemetry.vibration || 0.1,
                powerOutput: baselineTelemetry.powerOutput || 400.0,
                generatorLoad: baselineTelemetry.generatorLoad || 60.0,
                fuelLevel: baselineTelemetry.fuelLevel || 50.0,
                coolantTemperature: baselineTelemetry.coolantTemperature || 75.0,
                batteryVoltage: baselineTelemetry.batteryVoltage || 24.0
            },
            changes: changes
        };

        const response = await axios.post(`${getMlUrl()}/simulation`, payload, {
            timeout: TIMEOUT_MS
        });
        
        return response.data;
    } catch (error) {
        console.error(`[ML] Request to /simulation failed for asset ${assetId}:`, error.message);
        return {
            status: "UNAVAILABLE",
            message: "ML simulation service unavailable."
        };
    }
}

async function getHealth() {
    try {
        const response = await axios.get(`${getMlUrl()}/health`, { timeout: 3000 });
        return response.data;
    } catch (error) {
        console.error(`[ML] Health check failed:`, error.message);
        return {
            status: "UNAVAILABLE"
        };
    }
}

// Keeping legacy stubs for backward compatibility if needed, but routing through unified is better
async function getAssetRisk(assetId) {
    return { level: "UNKNOWN", score: 0 };
}
async function getAnomalyScore(assetId) {
    return { score: 0, detected: false };
}
async function getFailureProbability(assetId) {
    return { probability: 0 };
}
async function getForecast(assetId) {
    return { values: [] };
}

module.exports = {
    getUnifiedIntelligence,
    runSimulation,
    getHealth,
    // Stubs
    getAssetRisk,
    getAnomalyScore,
    getFailureProbability,
    getForecast
};
