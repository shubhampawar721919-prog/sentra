const express = require('express');
const router = express.Router();
const axios = require('axios');
const Station = require('../models/Station');
const Asset = require('../models/Asset');
const Alert = require('../models/Alert');
const scenarioService = require('../services/scenarioService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/decision-center/:stationId
 * Returns the unified Decision Center payload:
 * - Station overview metrics
 * - Active threat scenario & diagnostic triggers
 * - Standardized impact chain (Direct -> Downstream -> Station)
 * - 4 Pre-computed mitigation simulations
 * - Deterministic recommended response & score
 * - Supporting evidence checklist
 */
router.get('/:stationId', async (req, res) => {
    try {
        const station = await Station.findById(req.params.stationId);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

        const [assets, activeAlerts] = await Promise.all([
            Asset.find({ stationId: station._id }),
            Alert.find({ stationId: station._id, status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'ACTION_PLANNED'] } })
                .populate('assetId', 'name assetId type')
                .sort({ timestamp: -1 })
        ]);

        // Get station intelligence from internal route logic or service
        const baseUrl = `http://localhost:${process.env.PORT || 5001}`;
        let stationIntelligence = null;
        try {
            const intelRes = await axios.get(`${baseUrl}/api/stations/${station._id}/intelligence`);
            stationIntelligence = intelRes.data?.data;
        } catch (err) {
            console.warn("Internal intelligence fetch fallback:", err.message);
        }

        const decisionData = scenarioService.buildDecisionCenterScenario(station, stationIntelligence, activeAlerts);

        res.json({
            success: true,
            data: decisionData
        });
    } catch (err) {
        console.error("Decision Center error:", err);
        res.status(500).json({ success: false, message: 'Server error loading Decision Center' });
    }
});

/**
 * POST /api/decision-center/:stationId/simulate-action
 * Executes an arbitrary custom What-If scenario against current baseline without DB mutations.
 */
router.post('/:stationId/simulate-action', async (req, res) => {
    try {
        const { demandDeltaKw, generationDeltaKw, actionName } = req.body;
        const station = await Station.findById(req.params.stationId);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

        const baseUrl = `http://localhost:${process.env.PORT || 5001}`;
        const intelRes = await axios.get(`${baseUrl}/api/stations/${station._id}/intelligence`);
        const intel = intelRes.data?.data;

        const baseGen = intel?.energy?.currentGeneration || 480;
        const baseDemand = intel?.energy?.estimatedDemand || 420;
        const baseResilience = intel?.resilienceScore || 79;
        const baseFuelDays = intel?.fuel?.remainingRuntimeDays || 19.2;

        const simGen = Math.max(100, baseGen + (Number(generationDeltaKw) || 0));
        const simDemand = Math.max(150, baseDemand + (Number(demandDeltaKw) || 0));
        const simMargin = simGen - simDemand;

        const marginDelta = simMargin - (baseGen - baseDemand);
        const resilienceDelta = Math.round(marginDelta * 0.15);
        const simResilience = Math.max(10, Math.min(100, baseResilience + resilienceDelta));

        const fuelDeltaDays = Number((-(Number(generationDeltaKw) || 0) * 0.006 - (Number(demandDeltaKw) || 0) * 0.02).toFixed(1));

        res.json({
            success: true,
            data: {
                actionName: actionName || 'Custom Operational Adjustment',
                simulationNote: 'SIMULATION — NO DATABASE CHANGES',
                baseline: {
                    resilience: baseResilience,
                    generation: baseGen,
                    demand: baseDemand,
                    margin: baseGen - baseDemand,
                    fuelDays: baseFuelDays
                },
                simulated: {
                    resilience: simResilience,
                    resilienceDelta: resilienceDelta,
                    generation: simGen,
                    demand: simDemand,
                    margin: simMargin,
                    marginDelta: marginDelta,
                    fuelDays: Number((baseFuelDays + fuelDeltaDays).toFixed(1)),
                    fuelDeltaDays: fuelDeltaDays,
                    postActionRisk: simMargin > 70 ? 'LOW' : simMargin > 30 ? 'MEDIUM' : 'HIGH'
                }
            }
        });
    } catch (err) {
        console.error("Custom simulation error:", err);
        res.status(500).json({ success: false, message: 'Server error simulating scenario' });
    }
});

/**
 * POST /api/decision-center/:stationId/explain
 * Provides natural-language AI explanation from Groq strictly to elucidate the deterministic recommendation.
 */
router.post('/:stationId/explain', async (req, res) => {
    try {
        const { scenarioTitle, recommendedAction, rationale, stationName } = req.body;

        const payload = {
            assetId: recommendedAction?.selectedActionId || 'STATION-DECISION',
            telemetry: {
                temperature: -30.5,
                vibration: 0.22,
                powerOutput: 490,
                generatorLoad: 72,
                fuelLevel: 73,
                coolantTemperature: 78,
                batteryVoltage: 24.2
            },
            anomaly: { score: 0.62, detected: true },
            failurePrediction: { probability: 0.58 },
            risk: { level: 'HIGH', score: 0.58 },
            cascade: { affectedAssets: ['BAT-01', 'BAT-02', 'HVAC-01', 'HVAC-02', 'PUMP-01', 'COM-01'] },
            decision: {
                priority: 'ACTION REQUIRED',
                action: `${recommendedAction?.selectedActionName || 'Recommended Response'} for ${stationName || 'Bharati Station'}. Rationale: ${rationale || 'Optimal resilience and energy margin gain.'}`
            }
        };

        const response = await axios.post(`${ML_SERVICE_URL}/ai-analysis`, payload, { timeout: 10000 });

        const analysisText = response.data?.analysis || rationale;
        const isFailed = analysisText.toLowerCase().includes('failed') || analysisText.toLowerCase().includes('not configured');

        res.json({
            success: true,
            data: {
                available: !isFailed,
                analysis: isFailed ? 'AI EXPLANATION UNAVAILABLE — The natural-language explanation service is temporarily unreachable. All deterministic operational recommendations, mathematical formulas, and score breakdowns remain fully active and valid.' : analysisText,
                possibleCauses: isFailed ? ['Mechanical bearing variance', 'Severe polar ambient cold imposing high thermal demand'] : (response.data?.possibleCauses || ['Mechanical bearing wear', 'Thermal load imbalance']),
                recommendation: response.data?.recommendation || recommendedAction?.selectedActionName
            }
        });
    } catch (err) {
        console.warn("Groq explanation unavailable:", err.message);
        res.json({
            success: true,
            data: {
                available: false,
                analysis: 'AI EXPLANATION UNAVAILABLE — The natural-language explanation service is temporarily unreachable. All deterministic operational recommendations, numerical scores, and score breakdowns remain fully active and valid.',
                possibleCauses: ['Mechanical bearing variance', 'Severe polar ambient cold imposing high thermal demand'],
                recommendation: req.body.recommendedAction?.selectedActionName || 'Proceed with planned mitigation response.'
            }
        });
    }
});

module.exports = router;
