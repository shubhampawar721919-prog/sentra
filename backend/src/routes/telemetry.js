const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');
const scadaBridgeService = require('../services/scadaBridgeService');

// Industrial SCADA Modbus TCP Status & Register Inspector Endpoint
router.get('/scada/status', async (req, res) => {
    try {
        const stationCode = req.query.stationCode || 'BHR';
        const latestTelemetry = await Telemetry.findOne().sort({ timestamp: -1 });
        const scadaStatus = scadaBridgeService.getScadaGatewayStatus(latestTelemetry, stationCode);
        res.json({ success: true, data: scadaStatus });
    } catch (err) {
        console.error("SCADA status error:", err);
        res.status(500).json({ success: false, message: 'Server error retrieving SCADA gateway status' });
    }
});

router.get('/:assetId', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const telemetry = await Telemetry.find({ assetId: req.params.assetId })
            .sort({ timestamp: -1 })
            .limit(limit);
        res.json({ success: true, data: telemetry.reverse() }); // Return chronologically for charts
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:assetId/latest', async (req, res) => {
    try {
        const telemetry = await Telemetry.findOne({ assetId: req.params.assetId }).sort({ timestamp: -1 });
        if (!telemetry) return res.status(404).json({ success: false, message: 'No telemetry found' });
        res.json({ success: true, data: telemetry });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
