const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Telemetry = require('../models/Telemetry');
const intelligenceService = require('../services/intelligenceService');

router.get('/', async (req, res) => {
    try {
        const assets = await Asset.find().populate('stationId', 'name code');
        res.json({ success: true, data: assets });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id).populate('stationId', 'name code');
        if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
        
        // 1. Get latest telemetry
        const latestTelemetry = await Telemetry.findOne({ assetId: asset._id }).sort({ timestamp: -1 });
        
        const assetData = asset.toJSON();
        
        // 2. Call ML Service via abstraction
        if (latestTelemetry) {
            const intelligence = await intelligenceService.getUnifiedIntelligence(asset.assetId, latestTelemetry);
            assetData.intelligence = intelligence;
            
            // Phase 7: Evaluate and create alert if necessary
            const alertCreationService = require('../services/alertCreationService');
            await alertCreationService.evaluateAndCreateAlert(req.app.get('io'), asset, intelligence);
            
        } else {
            assetData.intelligence = { status: "UNAVAILABLE", message: "No telemetry data available for ML inference." };
        }
        
        res.json({ success: true, data: assetData });
    } catch (err) {
        console.error("Asset fetch error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
