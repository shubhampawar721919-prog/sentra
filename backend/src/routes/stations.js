const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const Asset = require('../models/Asset');
const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');
const intelligenceService = require('../services/intelligenceService');
const environmentalService = require('../services/environmentalService');
const energyService = require('../services/energyService');
const fuelService = require('../services/fuelService');
const resilienceService = require('../services/resilienceService');
const trendService = require('../services/trendService');
const dependencyService = require('../services/dependencyService');
const logisticsService = require('../services/logisticsService');

router.get('/', async (req, res) => {
    try {
        const stations = await Station.find();
        res.json({ success: true, data: stations });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Phase 9: Side-by-side Station Comparison
router.get('/comparison', async (req, res) => {
    try {
        const stations = await Station.find();
        const comparisonList = [];

        for (const s of stations) {
            const openAlerts = await Alert.find({ stationId: s._id, status: { $ne: 'RESOLVED' } });
            const activeAlerts = openAlerts.filter(a => a.status === 'ACTIVE');

            // Fetch key telemetries
            const genAssets = assets.filter(a => a.type?.includes('Generator') || a.assetId?.includes('DG'));
            const envAsset = assets.find(a => a.type?.includes('Environmental') || a.assetId?.includes('ENV'));
            const fuelAsset = assets.find(a => a.type?.includes('Fuel'));

            const genTelemetries = [];
            for (const g of genAssets) {
                const tel = await Telemetry.findOne({ assetId: g._id }).sort({ timestamp: -1 });
                if (tel) genTelemetries.push(tel);
            }

            const envTel = envAsset ? await Telemetry.findOne({ assetId: envAsset._id }).sort({ timestamp: -1 }) : null;
            const fuelTel = fuelAsset ? await Telemetry.findOne({ assetId: fuelAsset._id }).sort({ timestamp: -1 }) : null;

            const envData = environmentalService.evaluateEnvironment(envTel);
            const energyData = energyService.evaluateEnergy(genTelemetries, envData.stressFactor);
            const fuelData = fuelService.evaluateFuel(fuelTel, [], envData.stressFactor);

            const resData = resilienceService.calculateStationResilience({
                primaryRiskScore: activeAlerts.length > 0 ? 0.58 : 0.12,
                activeAlerts: activeAlerts,
                cascadeAffectedAssets: activeAlerts.length > 0 ? ['BAT-01', 'HVAC-01'] : [],
                energyMargin: energyData.energyMargin,
                energyScore: energyData.energyScore,
                fuelDaysRemaining: fuelData.remainingRuntimeDays,
                fuelScore: fuelData.fuelScore,
                environmentalStress: envData.stressFactor,
                environmentalScore: envData.environmentalScore
            });

            comparisonList.push({
                stationId: s._id,
                name: s.name,
                code: s.code,
                location: s.location,
                environmentType: s.environment,
                resilienceScore: resData.score,
                resilienceStatus: resData.status,
                operationalStatus: resData.operationalStatus,
                environmentalCondition: envData.condition,
                temperature: envData.temperature,
                energyMargin: energyData.energyMargin,
                energyStatus: energyData.status,
                fuelDaysRemaining: fuelData.remainingRuntimeDays,
                fuelStatus: fuelData.status,
                activeAlertsCount: activeAlerts.length,
                primaryThreat: activeAlerts[0]?.assetName || (genAssets[0]?.name ?? 'None')
            });
        }

        res.json({ success: true, data: comparisonList });
    } catch (err) {
        console.error("Station comparison error:", err);
        res.status(500).json({ success: false, message: 'Server error comparing stations' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
        res.json({ success: true, data: station });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:stationId/assets', async (req, res) => {
    try {
        const assets = await Asset.find({ stationId: req.params.stationId });
        res.json({ success: true, data: assets });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Phase 8: Historical trends & asset degradation
router.get('/:stationId/trends', async (req, res) => {
    try {
        const timeframe = req.query.timeframe || '24h';
        const trends = await trendService.getStationTrends(req.params.stationId, timeframe);
        res.json({ success: true, data: trends });
    } catch (err) {
        console.error("Station trends error:", err);
        res.status(500).json({ success: false, message: 'Server error fetching trends' });
    }
});

// Phase 10: Canonical Station Dependencies & Operational Zones
router.get('/:stationId/dependencies', async (req, res) => {
    try {
        const station = await Station.findById(req.params.stationId);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

        const assets = await Asset.find({ stationId: station._id });
        const dependencies = dependencyService.getStationDependencies(station.code, assets);
        res.json({ success: true, data: dependencies });
    } catch (err) {
        console.error("Station dependencies error:", err);
        res.status(500).json({ success: false, message: 'Server error fetching dependencies' });
    }
});

// Phase 10: Dynamic Cascade Impact Chain for a single asset
router.get('/:stationId/cascade/:assetId', async (req, res) => {
    try {
        const station = await Station.findById(req.params.stationId);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

        const chain = dependencyService.getDownstreamChain(req.params.assetId, station.code);
        const upstream = dependencyService.getUpstreamChain(req.params.assetId, station.code);
        res.json({ success: true, data: { ...chain, upstream } });
    } catch (err) {
        console.error("Cascade chain error:", err);
        res.status(500).json({ success: false, message: 'Server error fetching cascade chain' });
    }
});

// Phase 11: Remote Logistics, Spare Parts Inventory, and Vessel Resupply Tracking
router.get('/:stationId/logistics', async (req, res) => {
    try {
        const station = await Station.findById(req.params.stationId);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

        const fuelAsset = await Asset.findOne({ stationId: station._id, type: { $regex: /fuel/i } });
        let fuelDays = 19.2;
        if (fuelAsset) {
            const fuelTel = await Telemetry.findOne({ assetId: fuelAsset._id }).sort({ timestamp: -1 });
            if (fuelTel) {
                const fuelData = fuelService.evaluateFuel(fuelTel, [], 0.5);
                fuelDays = fuelData.remainingRuntimeDays;
            }
        }

        const logisticsData = logisticsService.evaluateLogistics(station.code, fuelDays);
        res.json({ success: true, data: logisticsData });
    } catch (err) {
        console.error("Logistics fetch error:", err);
        res.status(500).json({ success: false, message: 'Server error fetching logistics' });
    }
});

router.get('/:stationId/assets/:assetId/spares', async (req, res) => {
    try {
        const station = await Station.findById(req.params.stationId);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

        const spares = logisticsService.getSparesForAsset(station.code, req.params.assetId);
        res.json({ success: true, data: spares });
    } catch (err) {
        console.error("Asset spares error:", err);
        res.status(500).json({ success: false, message: 'Server error fetching asset spares' });
    }
});

// Phase 8: Unified Station Operations & Resilience Intelligence
router.get('/:stationId/intelligence', async (req, res) => {
    try {
        const station = await Station.findById(req.params.stationId);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

        const assets = await Asset.find({ stationId: station._id });
        if (!assets || assets.length === 0) {
            return res.json({ success: true, data: { status: "UNAVAILABLE", message: "No assets found for station." }});
        }
        
        let highestRiskAsset = null;
        let highestRiskScore = -1;
        let stationIntelligence = [];

        // Track telemetry for energy, weather, and fuel calculations
        const generatorTelemetries = [];
        let weatherTelemetry = null;
        let fuelTelemetry = null;

        for (const asset of assets) {
            const latestTelemetry = await Telemetry.findOne({ assetId: asset._id }).sort({ timestamp: -1 });
            if (latestTelemetry) {
                // Categorize for operational intelligence
                if (asset.type === 'Generator' || asset.assetId.includes('DG')) {
                    generatorTelemetries.push(latestTelemetry);
                } else if (asset.assetId === 'ENV-01' || asset.type === 'Environmental Sensor') {
                    weatherTelemetry = latestTelemetry;
                } else if (asset.assetId === 'FUEL-01' || asset.type === 'Fuel System') {
                    fuelTelemetry = latestTelemetry;
                }

                // Call ML engine
                const intelligence = await intelligenceService.getUnifiedIntelligence(asset.assetId, latestTelemetry);
                
                if (intelligence && intelligence.status !== "UNAVAILABLE") {
                    stationIntelligence.push(intelligence);
                    
                    // Evaluate and create alert if necessary
                    const alertCreationService = require('../services/alertCreationService');
                    await alertCreationService.evaluateAndCreateAlert(req.app.get('io'), asset, intelligence);
                    
                    if (intelligence.risk && intelligence.risk.score > highestRiskScore) {
                        highestRiskScore = intelligence.risk.score;
                        highestRiskAsset = intelligence;
                    }
                }
            }
        }

        // Open and active alerts for this station
        const openAlerts = await Alert.find({ stationId: station._id, status: { $ne: 'RESOLVED' } });
        const activeAlerts = openAlerts.filter(a => a.status === 'ACTIVE');

        // Check ML layer availability
        const mlAvailable = stationIntelligence.length > 0;

        // 1. Environmental Intelligence
        const envData = environmentalService.evaluateEnvironment(weatherTelemetry);

        // 2. Historical generator telemetry for energy forecast
        const dg01 = assets.find(a => a.assetId === 'DG-001') || assets.find(a => a.type?.includes('Generator'));
        const histGenTelemetry = dg01 
            ? await Telemetry.find({ assetId: dg01._id }).sort({ timestamp: -1 }).limit(24) 
            : [];

        // 3. Energy Intelligence
        const energyData = energyService.evaluateEnergy(
            generatorTelemetries, 
            envData.stressFactor, 
            histGenTelemetry.reverse()
        );

        // 4. Historical fuel telemetry for burn rate
        const fuelAsset = assets.find(a => a.assetId === 'FUEL-01') || assets.find(a => a.type?.includes('Fuel'));
        const histFuelTelemetry = fuelAsset 
            ? await Telemetry.find({ assetId: fuelAsset._id }).sort({ timestamp: -1 }).limit(24) 
            : [];

        // 5. Fuel Intelligence
        const fuelData = fuelService.evaluateFuel(
            fuelTelemetry, 
            histFuelTelemetry.reverse(), 
            envData.stressFactor
        );

        // 6. Station Resilience Score
        const cascadeAffected = highestRiskAsset?.cascade?.affectedAssets || [];
        const resilienceData = resilienceService.calculateStationResilience({
            primaryRiskScore: mlAvailable ? (highestRiskScore >= 0 ? highestRiskScore : 0.15) : 0.1,
            activeAlerts: openAlerts,
            cascadeAffectedAssets: cascadeAffected,
            energyMargin: energyData.energyMargin,
            energyScore: energyData.energyScore,
            fuelDaysRemaining: fuelData.remainingRuntimeDays,
            fuelScore: fuelData.fuelScore,
            environmentalStress: envData.stressFactor,
            environmentalScore: envData.environmentalScore
        });

        // 6b. Remote Logistics & Spares Intelligence
        const logisticsData = logisticsService.evaluateLogistics(station.code, fuelData.remainingRuntimeDays);

        // 7. Root Risk & Operational Action Analysis
        const primaryAssetId = mlAvailable ? (highestRiskAsset?.assetId || (dg01 ? dg01.assetId : 'DG-001')) : 'N/A';
        const primaryAssetDoc = assets.find(a => a.assetId === primaryAssetId);
        
        const rootRiskAnalysis = mlAvailable ? {
            assetId: primaryAssetId,
            assetName: primaryAssetDoc?.name || 'Primary Diesel Generator',
            primaryThreat: highestRiskAsset?.decision?.action || 'Routine baseline monitoring.',
            why: highestRiskAsset?.decision?.reason?.length > 0 
                ? highestRiskAsset.decision.reason 
                : ['Sensor variance operating within expected nominal boundaries.'],
            predictedImpact: cascadeAffected.length > 0 
                ? [`${primaryAssetId} → ${cascadeAffected.join(' → ')}`] 
                : ['No downstream critical cascade propagation.'],
            recommendedAction: highestRiskAsset?.decision?.action || 'Maintain standard operational surveillance.'
        } : {
            assetId: 'N/A',
            assetName: 'ML Service Offline',
            primaryThreat: 'ML intelligence service is offline.',
            why: ['FastAPI ML service unreachable at port 8000.'],
            predictedImpact: ['Predictive risk and anomaly scores temporarily unavailable.'],
            recommendedAction: 'Verify Python ML service status.'
        };

        res.json({
            success: true,
            data: {
                // Preserved Phase 6/7.1 Contract
                mlStatus: mlAvailable ? "ONLINE" : "OFFLINE",
                mlAvailable: mlAvailable,
                stationRisk: mlAvailable ? (highestRiskAsset?.risk || { level: "LOW", score: 0.1 }) : { level: "UNAVAILABLE", score: null },
                primaryRiskAsset: mlAvailable ? primaryAssetId : null,
                cascadeImpact: cascadeAffected,
                decision: mlAvailable ? (highestRiskAsset?.decision || { priority: "MONITOR", action: "Maintain routine monitoring." }) : { priority: "UNAVAILABLE", action: "ML intelligence service is offline." },
                assetsIntelligence: stationIntelligence,

                // Phase 8 Station Intelligence
                resilienceScore: resilienceData.score,
                resilienceStatus: resilienceData.status,
                operationalStatus: resilienceData.operationalStatus,
                resilienceBreakdown: resilienceData.breakdown,
                resilienceAudit: resilienceData.penaltyAudit,

                environmental: envData,
                energy: energyData,
                fuel: fuelData,
                logistics: logisticsData,

                activeAlertsCount: activeAlerts.length,
                activeAlerts: activeAlerts,
                openAlertsCount: openAlerts.length,
                openAlerts: openAlerts,

                rootRiskAnalysis: rootRiskAnalysis,

                // Phase 10: Canonical Dependencies & Schematic Zones
                dependencies: dependencyService.getStationDependencies(station.code, assets)
            }
        });
        
    } catch (err) {
        console.error("Station intelligence error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
