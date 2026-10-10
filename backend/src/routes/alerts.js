const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.stationId && req.query.stationId !== 'All') filter.stationId = req.query.stationId;
        if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
        if (req.query.severity && req.query.severity !== 'All') filter.severity = req.query.severity;
        if (req.query.faultClass && req.query.faultClass !== 'All') filter.faultClass = req.query.faultClass;
        if (req.query.sensorId) filter.sensorId = req.query.sensorId;
        
        const alerts = await Alert.find(filter)
            .populate('assetId', 'name assetId type')
            .populate('stationId', 'name')
            .sort({ timestamp: -1 });
        res.json({ success: true, data: alerts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('assetId', 'name assetId type')
            .populate('stationId', 'name');
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/acknowledge', async (req, res) => {
    try {
        const now = new Date();
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

        alert.status = 'ACKNOWLEDGED';
        alert.acknowledgedAt = now;
        if (!alert.timelineEvents) alert.timelineEvents = [];
        alert.timelineEvents.push({
            time: now,
            title: 'Operator Acknowledged Incident',
            description: 'Incident command console verified notification and initiated diagnosis.',
            type: 'ack'
        });

        await alert.save();
        req.app.get('io').emit('alert:updated', alert);
        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/action-planned', async (req, res) => {
    try {
        const now = new Date();
        const { actionPlan } = req.body;
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

        alert.status = 'ACTION_PLANNED';
        alert.actionPlannedAt = now;
        alert.actionPlan = actionPlan || { name: 'Operational Mitigation Selected' };
        if (!alert.timelineEvents) alert.timelineEvents = [];
        alert.timelineEvents.push({
            time: now,
            title: `Mitigation Action Planned: ${actionPlan?.name || 'Selected Response'}`,
            description: actionPlan?.rationale || 'Operator committed to recommended operational mitigation strategy.',
            type: 'action'
        });

        await alert.save();
        req.app.get('io').emit('alert:updated', alert);
        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/resolve', async (req, res) => {
    try {
        const now = new Date();
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

        alert.status = 'RESOLVED';
        alert.resolvedAt = now;
        if (!alert.timelineEvents) alert.timelineEvents = [];
        alert.timelineEvents.push({
            time: now,
            title: 'Incident Resolved & Closed',
            description: 'Post-mitigation telemetry restored nominal parameters; incident closed.',
            type: 'resolve'
        });

        await alert.save();
        req.app.get('io').emit('alert:updated', alert);
        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id/timeline', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

        // Compile real chronological events
        let events = [...(alert.timelineEvents || [])];
        if (events.length === 0) {
            // Default chronological baseline from alert fields
            events.push({
                time: new Date(new Date(alert.timestamp).getTime() - 600000),
                title: 'Sensor Harmonic Anomaly Detected',
                description: 'Telemetry exceeded baseline variance envelope.',
                type: 'warning'
            });
            events.push({
                time: new Date(new Date(alert.timestamp).getTime() - 300000),
                title: 'Failure Probability Spike',
                description: `XGBoost model elevated failure probability to ${Math.round((alert.failureProbability || 0.5) * 100)}%.`,
                type: 'warning'
            });
            events.push({
                time: alert.timestamp,
                title: 'Operational Alert Dispatched',
                description: `${alert.severity} alert broadcast to polar operations console.`,
                type: 'alert'
            });
            if (alert.acknowledgedAt) {
                events.push({
                    time: alert.acknowledgedAt,
                    title: 'Operator Acknowledged Incident',
                    description: 'Command confirmed incident awareness.',
                    type: 'ack'
                });
            }
            if (alert.actionPlannedAt) {
                events.push({
                    time: alert.actionPlannedAt,
                    title: `Action Planned: ${alert.actionPlan?.name || 'Selected Mitigation'}`,
                    description: 'Operator selected operational response scenario.',
                    type: 'action'
                });
            }
            if (alert.resolvedAt) {
                events.push({
                    time: alert.resolvedAt,
                    title: 'Incident Resolved',
                    description: 'Operational parameters restored to nominal.',
                    type: 'resolve'
                });
            }
        }

        // Sort chronologically
        events.sort((a, b) => new Date(a.time) - new Date(b.time));

        res.json({ success: true, data: events });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/explain', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id).populate('assetId');
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        
        const axios = require('axios');
        const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        
        // Fetch latest telemetry for this asset to send for AI analysis
        const Telemetry = require('../models/Telemetry');
        const latestTelemetry = await Telemetry.findOne({ assetId: alert.assetId._id }).sort({ timestamp: -1 });
        
        if (!latestTelemetry) {
            return res.status(400).json({ success: false, message: 'No telemetry available for analysis.' });
        }

        const payload = {
            assetId: alert.assetId.assetId,
            telemetry: {
                temperature: latestTelemetry.temperature || 0,
                vibration: latestTelemetry.vibration || 0,
                powerOutput: latestTelemetry.powerOutput || 0,
                generatorLoad: latestTelemetry.generatorLoad || 0,
                fuelLevel: latestTelemetry.fuelLevel || 0,
                coolantTemperature: latestTelemetry.coolantTemperature || 0,
                batteryVoltage: latestTelemetry.batteryVoltage || 0
            },
            anomaly: { score: alert.anomalyScore, detected: alert.anomalyScore > 0.5 },
            failurePrediction: { probability: alert.failureProbability },
            risk: { level: alert.riskLevel, score: alert.failureProbability }, // approx
            cascade: { affectedAssets: alert.affectedAssets },
            decision: { priority: alert.decisionPriority, action: alert.message }
        };

        const response = await axios.post(`${ML_SERVICE_URL}/ai-analysis`, payload, { timeout: 15000 });
        
        // Save explanation back to alert
        alert.explanation = response.data.analysis;
        await alert.save();
        
        req.app.get('io').emit('alert:updated', alert);
        res.json({ success: true, data: response.data });
    } catch (err) {
        console.error("AI Explanation Error:", err.message);
        res.status(500).json({ success: false, message: 'AI explanation temporarily unavailable.' });
    }
});

module.exports = router;
