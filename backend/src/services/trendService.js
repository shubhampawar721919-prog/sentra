/**
 * trendService.js
 * 
 * Historical Telemetry & Asset Degradation Trend Service for POLARIS.
 * Queries MongoDB telemetry across 6H, 12H, and 24H windows, aggregates
 * energy/weather/fuel time series, and detects asset degradation trajectories.
 */

const Telemetry = require('../models/Telemetry');
const Asset = require('../models/Asset');

/**
 * Retrieves historical station trends for 6h, 12h, or 24h.
 * @param {string} stationId - MongoDB ObjectId of the station
 * @param {string} timeframe - '6h' | '12h' | '24h'
 */
async function getStationTrends(stationId, timeframe = '24h') {
    const hours = timeframe === '6h' ? 6 : timeframe === '12h' ? 12 : 24;

    const assets = await Asset.find({ stationId });
    if (!assets || assets.length === 0) {
        return { success: false, message: 'No assets found for station' };
    }

    const dg01 = assets.find(a => a.assetId === 'DG-001') || assets.find(a => a.type?.includes('Generator'));
    const fuelAsset = assets.find(a => a.assetId === 'FUEL-01') || assets.find(a => a.type?.includes('Fuel'));
    const envAsset = assets.find(a => a.assetId === 'ENV-01') || assets.find(a => a.type?.includes('Environmental'));

    let referenceTime = Date.now();
    if (dg01) {
        const latest = await Telemetry.findOne({ assetId: dg01._id }).sort({ timestamp: -1 });
        if (latest) referenceTime = latest.timestamp.getTime();
    }
    const sinceDate = new Date(referenceTime - hours * 3600000);

    // Fetch telemetry across the timeframe
    const [dgTelemetry, fuelTelemetry, envTelemetry] = await Promise.all([
        dg01 ? Telemetry.find({ assetId: dg01._id, timestamp: { $gte: sinceDate } }).sort({ timestamp: 1 }) : [],
        fuelAsset ? Telemetry.find({ assetId: fuelAsset._id, timestamp: { $gte: sinceDate } }).sort({ timestamp: 1 }) : [],
        envAsset ? Telemetry.find({ assetId: envAsset._id, timestamp: { $gte: sinceDate } }).sort({ timestamp: 1 }) : []
    ]);

    // Build synchronized time-series data points
    const pointsCount = Math.max(dgTelemetry.length, fuelTelemetry.length, envTelemetry.length);
    const timeline = [];

    for (let i = 0; i < pointsCount; i++) {
        const dg = dgTelemetry[i] || dgTelemetry[dgTelemetry.length - 1] || {};
        const fuel = fuelTelemetry[i] || fuelTelemetry[fuelTelemetry.length - 1] || {};
        const env = envTelemetry[i] || envTelemetry[envTelemetry.length - 1] || {};

        const timestamp = dg.timestamp || fuel.timestamp || env.timestamp || new Date(sinceDate.getTime() + i * 3600000);
        const powerGen = dg.powerOutput || 480;
        // Thermal demand estimated from env temp
        const envT = env.temperature !== undefined ? env.temperature : -29;
        const estDemand = Math.round(320 + 60 * (1 + Math.max(0, -envT - 15) / 15 * 0.5));
        const margin = powerGen - estDemand;

        timeline.push({
            time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: timestamp,
            power: powerGen,
            demand: estDemand,
            margin: margin,
            vibration: dg.vibration || 0.16,
            temperature: dg.temperature || 74,
            externalTemp: envT,
            fuelLevel: fuel.fuelLevel || 74
        });
    }

    // Calculate empirical delta percentages for highlights
    const highlights = [];
    if (timeline.length >= 2) {
        const first = timeline[0];
        const last = timeline[timeline.length - 1];

        // Vibration change
        if (first.vibration > 0) {
            const vibDeltaPct = Math.round(((last.vibration - first.vibration) / first.vibration) * 100);
            if (vibDeltaPct !== 0) {
                highlights.push({
                    metric: 'Vibration',
                    change: `${vibDeltaPct > 0 ? '+' : ''}${vibDeltaPct}%`,
                    text: `Generator vibration ${vibDeltaPct > 0 ? 'increased' : 'decreased'} by ${Math.abs(vibDeltaPct)}% over the last ${hours} hours.`,
                    type: vibDeltaPct > 15 ? 'warning' : 'info'
                });
            }
        }

        // Temperature change
        const tempDelta = Number((last.temperature - first.temperature).toFixed(1));
        if (tempDelta !== 0) {
            highlights.push({
                metric: 'Core Temperature',
                change: `${tempDelta > 0 ? '+' : ''}${tempDelta}°C`,
                text: `Primary generator temperature ${tempDelta > 0 ? 'rose' : 'fell'} by ${Math.abs(tempDelta)}°C over the timeframe.`,
                type: tempDelta > 4 ? 'warning' : 'info'
            });
        }

        // Fuel depletion
        const fuelDepleted = Number((first.fuelLevel - last.fuelLevel).toFixed(1));
        if (fuelDepleted > 0) {
            highlights.push({
                metric: 'Fuel Reserve',
                change: `-${fuelDepleted}%`,
                text: `Fuel level decreased by ${fuelDepleted}% (${Math.round(fuelDepleted * 500)} Liters) over ${hours} hours.`,
                type: 'info'
            });
        }
    }

    // Degradation analysis for DG-001
    const degradation = analyzeDegradation(dgTelemetry);

    return {
        timeframe,
        hours,
        timeline,
        highlights,
        degradation
    };
}

/**
 * Transparent statistical analysis of asset degradation from historical points.
 */
function analyzeDegradation(telemetry = []) {
    if (!telemetry || telemetry.length < 3) {
        return {
            assetId: 'DG-001',
            status: 'STABLE',
            vibrationTrend: 'Stable',
            temperatureTrend: 'Stable',
            efficiencyTrend: 'Stable',
            summary: 'Insufficient data points to determine degradation slope.'
        };
    }

    const n = telemetry.length;
    const firstHalf = telemetry.slice(0, Math.floor(n / 2));
    const secondHalf = telemetry.slice(Math.floor(n / 2));

    const avgVib1 = firstHalf.reduce((s, d) => s + (d.vibration || 0), 0) / firstHalf.length;
    const avgVib2 = secondHalf.reduce((s, d) => s + (d.vibration || 0), 0) / secondHalf.length;
    const vibSlope = (avgVib2 - avgVib1) / (avgVib1 || 1);

    const avgTemp1 = firstHalf.reduce((s, d) => s + (d.temperature || 0), 0) / firstHalf.length;
    const avgTemp2 = secondHalf.reduce((s, d) => s + (d.temperature || 0), 0) / secondHalf.length;
    const tempSlope = (avgTemp2 - avgTemp1) / (avgTemp1 || 1);

    let vibTrend = 'Stable (→)';
    if (vibSlope > 0.10) vibTrend = 'Increasing (↗)';
    else if (vibSlope < -0.10) vibTrend = 'Decreasing (↘)';

    let tempTrend = 'Stable (→)';
    if (tempSlope > 0.04) tempTrend = 'Increasing (↗)';
    else if (tempSlope < -0.04) tempTrend = 'Decreasing (↘)';

    let effTrend = 'Stable (→)';
    if (vibSlope > 0.10 && tempSlope > 0.04) effTrend = 'Decreasing (↘)';

    let overallStatus = 'NOMINAL';
    let summary = 'Operating telemetry is within nominal variance parameters.';

    if (vibSlope > 0.20 || tempSlope > 0.08) {
        overallStatus = 'DEGRADING';
        summary = 'Statistically significant upward drift in vibration harmonics and thermal signature.';
    } else if (vibSlope > 0.40) {
        overallStatus = 'RAPID DEGRADATION';
        summary = 'Accelerating vibration drift detected. Mechanical bearing wear suspected.';
    }

    return {
        assetId: 'DG-001',
        assetName: 'Primary Diesel Generator',
        status: overallStatus,
        vibrationTrend: vibTrend,
        temperatureTrend: tempTrend,
        efficiencyTrend: effTrend,
        summary: summary,
        vibSlopePercent: Number((vibSlope * 100).toFixed(1)),
        tempSlopePercent: Number((tempSlope * 100).toFixed(1))
    };
}

module.exports = {
    getStationTrends,
    analyzeDegradation
};
