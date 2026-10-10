const express = require('express');
const router = express.Router();
const axios = require('axios');
const Telemetry = require('../models/Telemetry');
const intelligenceService = require('../services/intelligenceService');

router.post('/', async (req, res) => {
    try {
        const { assetId, changes } = req.body;
        
        if (!assetId || !changes) {
            return res.status(400).json({ success: false, message: 'assetId and changes are required.' });
        }

        const Asset = require('../models/Asset');
        const asset = await Asset.findOne({ assetId });
        if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

        const latestTelemetry = await Telemetry.findOne({ assetId: asset._id }).sort({ timestamp: -1 });
        
        if (!latestTelemetry) {
            return res.status(404).json({ success: false, message: 'No baseline telemetry found for asset.' });
        }

        const simulationResult = await intelligenceService.runSimulation(assetId, latestTelemetry.toJSON(), changes);
        
        // Retrieve actual station baseline
        let baseResilience = 47;
        let baseMargin = 66;
        try {
            const baseUrl = `http://localhost:${process.env.PORT || 5001}`;
            const intelRes = await axios.get(`${baseUrl}/api/stations/${asset.stationId}/intelligence`);
            if (intelRes.data?.data) {
                baseResilience = intelRes.data.data.resilienceScore ?? 47;
                baseMargin = intelRes.data.data.energy?.energyMargin ?? 66;
            }
        } catch (err) {
            // fallback to station-appropriate defaults if internal fetch fails
        }

        const riskDelta = Math.max(0, simulationResult.change?.riskIncrease || 0);
        const cascadeCount = simulationResult.cascade?.cascadeRisks?.length || 0;
        
        // Explainable resilience impact
        const resilienceDrop = Math.min(baseResilience - 10, Math.round(riskDelta * 35 + cascadeCount * 4 + ((changes.generatorLoad && changes.generatorLoad > 80) ? 8 : 0)));
        const simulatedResilience = Math.max(10, baseResilience - resilienceDrop);

        // Energy margin impact
        let marginDrop = 0;
        if (changes.powerOutput !== undefined) {
            const powerDelta = Math.max(0, (latestTelemetry.powerOutput || 492) - changes.powerOutput);
            marginDrop = powerDelta;
        } else {
            const loadExcess = changes.generatorLoad ? Math.max(0, changes.generatorLoad - 68) : 0;
            marginDrop = Math.min(70, Math.round(loadExcess * 1.6 + riskDelta * 35));
        }
        const simulatedMargin = baseMargin - marginDrop;

        // Fuel consumption impact
        const fuelDeltaPercent = changes.generatorLoad ? Math.round(((changes.generatorLoad - 68) / 68) * 100) : 0;

        simulationResult.stationImpact = {
            baselineResilience: baseResilience,
            simulatedResilience: simulatedResilience,
            resilienceDrop: resilienceDrop,
            baselineEnergyMargin: baseMargin,
            simulatedEnergyMargin: simulatedMargin,
            fuelConsumptionDeltaPercent: fuelDeltaPercent > 0 ? `+${fuelDeltaPercent}%` : `${fuelDeltaPercent}%`
        };

        res.json({ success: true, data: simulationResult });
    } catch (err) {
        console.error("Simulation error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

const alertCreationService = require('../services/alertCreationService');
const Station = require('../models/Station');

router.post('/trigger-anomaly', async (req, res) => {
    try {
        const { assetId, telemetryOverrides } = req.body;
        if (!assetId) return res.status(400).json({ success: false, message: 'assetId is required.' });

        const Asset = require('../models/Asset');
        const asset = await Asset.findOne({ assetId });
        if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

        // Build anomalous telemetry
        const badTelemetry = await Telemetry.create({
            assetId: asset._id,
            timestamp: new Date(),
            temperature: telemetryOverrides?.temperature !== undefined ? telemetryOverrides.temperature : 125.0,
            vibration: telemetryOverrides?.vibration !== undefined ? telemetryOverrides.vibration : 2.85,
            powerOutput: telemetryOverrides?.powerOutput !== undefined ? telemetryOverrides.powerOutput : 490,
            generatorLoad: telemetryOverrides?.generatorLoad !== undefined ? telemetryOverrides.generatorLoad : 98,
            coolantTemperature: telemetryOverrides?.coolantTemperature !== undefined ? telemetryOverrides.coolantTemperature : 110.0,
            batteryVoltage: telemetryOverrides?.batteryVoltage !== undefined ? telemetryOverrides.batteryVoltage : 18.5,
            fuelLevel: telemetryOverrides?.fuelLevel !== undefined ? telemetryOverrides.fuelLevel : 70.0
        });

        asset.status = 'CRITICAL';
        await asset.save();

        // Wait a moment for ML pipeline
        await new Promise(r => setTimeout(r, 400));

        const intelligence = await intelligenceService.getUnifiedIntelligence(assetId, badTelemetry.toJSON());
        
        // Respect true ML model inference; only provide fallback if ML service is offline
        if (!intelligence.risk || intelligence.status === 'UNAVAILABLE') {
            intelligence.risk = { level: 'CRITICAL', score: 0.95 };
        }
        if (!intelligence.decision || intelligence.status === 'UNAVAILABLE') {
            intelligence.decision = {
                priority: 'URGENT',
                action: `CRITICAL ANOMALY: Immediate intervention required on ${asset.name} (${assetId}).`,
                reason: ['Critical telemetry threshold violation detected by operational safety watchdog.']
            };
        }

        // Pass the REAL socket.io instance
        const io = req.app.get('io');
        await alertCreationService.evaluateAndCreateAlert(io, asset, intelligence);

        if (io) {
            io.emit('telemetry:new', badTelemetry);
            io.emit('station:updated', { stationId: asset.stationId, assetId: asset.assetId });
        }

        res.json({
            success: true,
            intelligence: intelligence,
            message: `Critical anomaly successfully injected into ${assetId}. Telemetry updated and alerts broadcasted.`
        });
    } catch (err) {
        console.error("Trigger error:", err);
        res.status(500).json({ success: false, message: 'Server error triggering anomaly' });
    }
});

/**
 * POST /api/simulation/reset-nominal
 * Resets station equipment telemetry to safe, green nominal operational thresholds.
 */
router.post('/reset-nominal', async (req, res) => {
    try {
        const { stationId, assetId } = req.body;
        const Asset = require('../models/Asset');
        const Alert = require('../models/Alert');

        let targetStationId = stationId;
        if (!targetStationId) {
            const bharati = await Station.findOne({ code: 'BHR' });
            targetStationId = bharati?._id;
        }

        const query = { stationId: targetStationId };
        if (assetId) query.assetId = assetId;

        const assets = await Asset.find(query);
        const io = req.app.get('io');

        for (const asset of assets) {
            asset.status = 'NORMAL';
            await asset.save();

            // Insert healthy nominal telemetry
            await Telemetry.create({
                assetId: asset._id,
                timestamp: new Date(),
                temperature: asset.type?.toLowerCase().includes('generator') ? 72.0 : (asset.assetId.includes('ENV') ? -30.5 : 22.0),
                vibration: asset.type?.toLowerCase().includes('generator') ? 0.14 : 0.05,
                powerOutput: asset.assetId === 'DG-001' ? 485 : 0,
                generatorLoad: asset.assetId === 'DG-001' ? 72 : 0,
                coolantTemperature: 78.0,
                batteryVoltage: 24.6,
                fuelLevel: 82.0
            });
        }

        // Resolve active alerts for these assets
        const resolvedAt = new Date();
        await Alert.updateMany(
            {
                stationId: targetStationId,
                status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'ACTION_PLANNED'] }
            },
            {
                $set: {
                    status: 'RESOLVED',
                    resolvedAt,
                },
                $push: {
                    timelineEvents: {
                        time: resolvedAt,
                        title: 'Telemetry Restored to Nominal Baseline',
                        description: 'Simulated fault cleared by operator via testing console.',
                        type: 'resolve'
                    }
                }
            }
        );

        if (io) {
            io.emit('alert:resolved', { stationId: targetStationId });
            io.emit('station:updated', { stationId: targetStationId });
        }

        res.json({
            success: true,
            message: 'All equipment telemetry successfully restored to nominal operating state. Active alerts resolved.'
        });
    } catch (err) {
        console.error("Reset nominal error:", err);
        res.status(500).json({ success: false, message: 'Server error resetting to nominal' });
    }
});

/**
 * POST /api/simulation/reset-canonical
 * Restores the authoritative Phase 11.1 degraded baseline (DG-001 at 100.2°C, 0.72 mm/s, 1 alert).
 */
router.post('/reset-canonical', async (req, res) => {
    try {
        const Asset = require('../models/Asset');
        const Alert = require('../models/Alert');

        const bharati = await Station.findOne({ code: 'BHR' });
        if (!bharati) return res.status(404).json({ success: false, message: 'Bharati station not found' });

        const dg01 = await Asset.findOne({ assetId: 'DG-001' });
        if (dg01) {
            dg01.status = 'WARNING';
            await dg01.save();

            // Insert authoritative canonical degraded telemetry
            await Telemetry.create({
                assetId: dg01._id,
                timestamp: new Date(),
                temperature: 100.2,
                vibration: 0.720,
                powerOutput: 492,
                generatorLoad: 82,
                coolantTemperature: 101.5,
                fuelLevel: 73.0,
                batteryVoltage: 24.2
            });

            // Ensure single authoritative alert exists
            await Alert.deleteMany({ stationId: bharati._id });
            const canonicalAlert = await Alert.create({
                stationId: bharati._id,
                assetId: dg01._id,
                assetName: dg01.name,
                type: 'Operational',
                severity: 'HIGH',
                riskLevel: 'HIGH',
                anomalyScore: 0.41,
                failureProbability: 0.68,
                decisionPriority: 'ACTION REQUIRED',
                message: 'Primary generator mechanical bearing wear and elevated thermal profile detected.',
                explanation: 'Isolation forest detected vibrational anomaly (0.41). XGBoost failure probability is 0.68. Core temperature is 100.2°C.',
                affectedAssets: ['BAT-01', 'BAT-02', 'HVAC-01', 'HVAC-02', 'PUMP-01', 'COM-01'],
                status: 'ACTIVE'
            });

            const io = req.app.get('io');
            if (io) {
                io.emit('alert:created', canonicalAlert);
                io.emit('station:updated', { stationId: bharati._id });
            }
        }

        res.json({
            success: true,
            message: 'Station restored to authoritative Phase 11.1 canonical degraded baseline (DG-001 @ 100.2°C, 0.72 mm/s).'
        });
    } catch (err) {
        console.error("Reset canonical error:", err);
        res.status(500).json({ success: false, message: 'Server error restoring canonical baseline' });
    }
});

module.exports = router;
