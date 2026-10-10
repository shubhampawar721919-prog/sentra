const axios = require('axios');
const Sensor = require('../models/Sensor');
const Alert = require('../models/Alert');
const Asset = require('../models/Asset');
const Station = require('../models/Station');
const Telemetry = require('../models/Telemetry');
const EvaluationResult = require('../models/EvaluationResult');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class SensorIntelligenceService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Seeds default monitored sensors if the collection is empty.
     */
    async ensureDefaultSensors(stationId) {
        const count = await Sensor.countDocuments();
        if (count > 0) return;

        console.log('Seeding default SENTRA sensor intelligence channels...');
        let targetStation = stationId;
        if (!targetStation) {
            const st = await Station.findOne({ code: 'BHR' });
            targetStation = st?._id;
        }

        const assets = await Asset.find({ stationId: targetStation });
        const dg = assets.find(a => a.assetId === 'DG-001') || assets[0];
        const hvac = assets.find(a => a.assetId === 'HVAC-01') || assets[1] || dg;
        const pump = assets.find(a => a.assetId === 'PUMP-01') || assets[2] || dg;
        const env = assets.find(a => a.assetId === 'MTR-ENV-01' || a.type?.includes('Environmental')) || dg;

        const defaultSensorSpecs = [
            // Sector A: Ambient & External Climate Masts
            {
                sensorId: 'SEN-TEMP-ENV-01',
                name: 'External Weather Mast Alpha Thermocouple',
                type: 'TEMPERATURE',
                unit: '°C',
                assetCode: env?.assetId || 'ENV-01',
                assetId: env?._id,
                location: 'North Meteorological Tower (10m elevation)',
                relatedSensors: ['SEN-TEMP-ENV-02', 'SEN-TEMP-ENV-03', 'SEN-TEMP-HVAC-01'],
                currentReading: -28.4,
                nominalRange: { min: -45, max: -10, typical: -28 },
                downstreamAssets: ['HVAC-01', 'HVAC-02'],
                trustScore: 96.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },
            {
                sensorId: 'SEN-TEMP-ENV-02',
                name: 'External Weather Mast Beta (Redundant Reference)',
                type: 'TEMPERATURE',
                unit: '°C',
                assetCode: env?.assetId || 'ENV-01',
                assetId: env?._id,
                location: 'South Meteorological Tower (10m elevation)',
                relatedSensors: ['SEN-TEMP-ENV-01', 'SEN-TEMP-ENV-03'],
                currentReading: -28.1,
                nominalRange: { min: -45, max: -10, typical: -28 },
                downstreamAssets: ['HVAC-01'],
                trustScore: 98.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },
            {
                sensorId: 'SEN-TEMP-ENV-03',
                name: 'East Oasis Microclimate Reference RTD',
                type: 'TEMPERATURE',
                unit: '°C',
                assetCode: env?.assetId || 'ENV-01',
                assetId: env?._id,
                location: 'Larsemann Perimeter Station',
                relatedSensors: ['SEN-TEMP-ENV-01', 'SEN-TEMP-ENV-02'],
                currentReading: -27.9,
                nominalRange: { min: -45, max: -10, typical: -28 },
                downstreamAssets: [],
                trustScore: 97.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },

            // Sector B: Primary Power Generation (DG-001)
            {
                sensorId: 'SEN-TEMP-DG01-CORE',
                name: 'DG-001 Cylinder Head Thermal Sensor',
                type: 'TEMPERATURE',
                unit: '°C',
                assetCode: dg?.assetId || 'DG-001',
                assetId: dg?._id,
                location: 'Generator Bay 1 - Engine Core Block',
                relatedSensors: ['SEN-TEMP-DG01-COOL', 'SEN-TEMP-DG02-CORE'],
                currentReading: 82.5,
                nominalRange: { min: 60, max: 98, typical: 80 },
                downstreamAssets: ['DG-001', 'BAT-01', 'HVAC-01'],
                trustScore: 94.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },
            {
                sensorId: 'SEN-TEMP-DG01-COOL',
                name: 'DG-001 Jacket Coolant Return Thermistor',
                type: 'TEMPERATURE',
                unit: '°C',
                assetCode: dg?.assetId || 'DG-001',
                assetId: dg?._id,
                location: 'Cooling Radiator Inlet Manifold',
                relatedSensors: ['SEN-TEMP-DG01-CORE', 'SEN-FLOW-COOL01'],
                currentReading: 76.2,
                nominalRange: { min: 55, max: 90, typical: 74 },
                downstreamAssets: ['DG-001', 'PUMP-01'],
                trustScore: 95.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },
            {
                sensorId: 'SEN-VIB-DG01-BRG',
                name: 'DG-001 Flywheel Bearing Tri-Axial Accelerometer',
                type: 'VIBRATION',
                unit: 'mm/s',
                assetCode: dg?.assetId || 'DG-001',
                assetId: dg?._id,
                location: 'Drive-End Bearing Housing',
                relatedSensors: ['SEN-VIB-PUMP01', 'SEN-TEMP-DG01-CORE'],
                currentReading: 0.18,
                nominalRange: { min: 0.05, max: 0.50, typical: 0.18 },
                downstreamAssets: ['DG-001'],
                trustScore: 93.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },
            {
                sensorId: 'SEN-PWR-DG01-OUT',
                name: 'Main 3-Phase Active Power Transducer',
                type: 'POWER',
                unit: 'kW',
                assetCode: dg?.assetId || 'DG-001',
                assetId: dg?._id,
                location: 'Main AC Bus Switchgear',
                relatedSensors: ['SEN-TEMP-DG01-CORE', 'SEN-VOLT-BAT01'],
                currentReading: 488.0,
                nominalRange: { min: 350, max: 550, typical: 485 },
                downstreamAssets: ['DG-001', 'BAT-01', 'HVAC-01', 'PUMP-01'],
                trustScore: 97.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },

            // Sector C: Climate Control & Life Support
            {
                sensorId: 'SEN-TEMP-HVAC-01',
                name: 'Central Habitat HVAC Air Handler Sensor',
                type: 'TEMPERATURE',
                unit: '°C',
                assetCode: hvac?.assetId || 'HVAC-01',
                assetId: hvac?._id,
                location: 'Station Main Habitat HVAC Plenum',
                relatedSensors: ['SEN-TEMP-ENV-01', 'SEN-PRES-HVAC01'],
                currentReading: 21.4,
                nominalRange: { min: 16, max: 25, typical: 21 },
                downstreamAssets: ['HVAC-01'],
                trustScore: 95.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },
            {
                sensorId: 'SEN-PRES-HVAC01',
                name: 'HVAC Differential Static Air Pressure Cell',
                type: 'PRESSURE',
                unit: 'bar',
                assetCode: hvac?.assetId || 'HVAC-01',
                assetId: hvac?._id,
                location: 'Supply Duct Static Probe',
                relatedSensors: ['SEN-TEMP-HVAC-01'],
                currentReading: 1.02,
                nominalRange: { min: 0.95, max: 1.15, typical: 1.01 },
                downstreamAssets: ['HVAC-01'],
                trustScore: 96.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            },

            // Sector D: Thermal Hydronics & Pumps
            {
                sensorId: 'SEN-VIB-PUMP01',
                name: 'Cooling Pump Alpha Impeller Vibration Sensor',
                type: 'VIBRATION',
                unit: 'mm/s',
                assetCode: pump?.assetId || 'PUMP-01',
                assetId: pump?._id,
                location: 'Circulation Loop Pumphead #1',
                relatedSensors: ['SEN-VIB-DG01-BRG'],
                currentReading: 0.08,
                nominalRange: { min: 0.02, max: 0.35, typical: 0.08 },
                downstreamAssets: ['PUMP-01', 'DG-001'],
                trustScore: 98.0,
                status: 'HEALTHY',
                faultClass: 'NORMAL'
            }
        ];

        const now = Date.now();
        for (const spec of defaultSensorSpecs) {
            // Build 24-step initial history
            const history = [];
            for (let k = 24; k >= 0; k--) {
                const noise = (Math.random() - 0.5) * 0.4;
                history.push({
                    timestamp: new Date(now - k * 60000),
                    value: Number((spec.currentReading + noise).toFixed(2)),
                    anomalyScore: 0.05,
                    isAnomaly: false,
                    faultClass: 'NORMAL',
                    trustScore: spec.trustScore
                });
            }

            await Sensor.create({
                ...spec,
                stationId: targetStation,
                lastSeen: new Date(),
                recentReadings: history,
                evidence: [{
                    factor: 'Continuous Stability',
                    value: `Operating at ${spec.currentReading} ${spec.unit}`,
                    impact: 'Nominal baseline verified',
                    scoreDelta: 0
                }]
            });
        }

        console.log(`Seeded ${defaultSensorSpecs.length} SENTRA intelligence channels.`);
    }

    /**
     * Ingest and evaluate sensor reading:
     * - Validates payload
     * - Queries Python ML engine (with reliable server-side fallback)
     * - Disambiguates genuine environmental events from sensor faults
     * - Updates trust score, status, and history
     * - Triggers or resolves alerts
     */
    async evaluateAndIngestReading(sensorId, rawValue, options = {}) {
        let sensor = await Sensor.findOne({ sensorId });
        if (!sensor) {
            throw new Error(`Sensor ${sensorId} not found`);
        }

        const isMissing = rawValue === null || rawValue === undefined || isNaN(rawValue);
        const reading = isMissing ? null : Number(rawValue);

        // Fetch peer readings
        const peerReadings = {};
        if (sensor.relatedSensors && sensor.relatedSensors.length > 0) {
            const peers = await Sensor.find({ sensorId: { $in: sensor.relatedSensors } });
            peers.forEach(p => {
                if (p.currentReading !== null && !isNaN(p.currentReading)) {
                    peerReadings[p.sensorId] = p.currentReading;
                }
            });
        }

        // Build history window for temporal analysis
        const historyValues = (sensor.recentReadings || []).map(r => r.value).filter(v => v !== null && !isNaN(v));

        let evalResult = null;
        try {
            // Attempt remote ML API call
            const mlRes = await axios.post(`${ML_SERVICE_URL}/sensor/evaluate`, {
                sensorId: sensor.sensorId,
                sensorType: sensor.type,
                reading: reading,
                unit: sensor.unit,
                history: historyValues,
                peerReadings: peerReadings,
                nominalRange: sensor.nominalRange
            }, { timeout: 1500 });
            evalResult = mlRes.data;
        } catch (err) {
            // Server-side fallback computation
            evalResult = this._computeLocalEvaluation(sensor, reading, historyValues, peerReadings);
        }

        // Update sensor model
        sensor.currentReading = isMissing ? sensor.currentReading : reading;
        sensor.lastSeen = new Date();
        sensor.status = evalResult.status;
        sensor.trustScore = evalResult.trustScore;
        sensor.anomalyScore = evalResult.anomalyScore;
        sensor.faultClass = evalResult.faultClass;
        sensor.isGenuineEvent = evalResult.isGenuineEvent;
        sensor.modelConfidence = evalResult.confidence;
        sensor.explanation = evalResult.explanation;
        sensor.evidence = evalResult.evidence;

        // Push into circular recentReadings buffer (max 60)
        if (!sensor.recentReadings) sensor.recentReadings = [];
        sensor.recentReadings.push({
            timestamp: new Date(),
            value: reading !== null ? reading : (sensor.recentReadings[sensor.recentReadings.length - 1]?.value || 0),
            anomalyScore: evalResult.anomalyScore,
            isAnomaly: evalResult.anomalyScore > 0.40,
            faultClass: evalResult.faultClass,
            trustScore: evalResult.trustScore
        });
        if (sensor.recentReadings.length > 60) {
            sensor.recentReadings.shift();
        }

        await sensor.save();

        // Manage Explainable Alerts based on evaluation outcome
        let createdAlert = null;
        if (evalResult.faultClass !== 'NORMAL' && evalResult.trustScore < 85.0 && !evalResult.isGenuineEvent) {
            createdAlert = await this._createOrUpdateSensorAlert(sensor, evalResult);
        } else if (evalResult.isGenuineEvent) {
            // Create a Genuine Environmental Event Notification (labeled as non-fault!)
            createdAlert = await this._createGenuineEventAlert(sensor, evalResult);
        }

        return {
            sensor,
            assessment: evalResult,
            alert: createdAlert
        };
    }

    /**
     * Deterministic local fallback evaluation logic.
     */
    _computeLocalEvaluation(sensor, reading, history, peerReadings) {
        const start = Date.now();
        if (reading === null || reading === undefined || isNaN(reading)) {
            return {
                sensorId: sensor.sensorId,
                status: 'STALE_MISSING',
                faultClass: 'MISSING_DROPOUT',
                isGenuineEvent: false,
                trustScore: 45.0,
                anomalyScore: 0.85,
                confidence: 0.98,
                explanation: 'Telemetry signal frame dropout detected. Zero data received.',
                evidence: [{
                    factor: 'Signal Dropout',
                    value: 'null / missing',
                    impact: 'Telemetry loss prevents state verification',
                    scoreDelta: -55.0
                }],
                latencyMs: Date.now() - start
            };
        }

        const window = history.slice(-10);
        const mean = window.length > 0 ? (window.reduce((a, b) => a + b, 0) / window.length) : reading;
        const variance = window.length > 1 ? (window.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / window.length) : 0.05;
        const std = Math.sqrt(variance);
        const lastDiff = history.length > 1 ? Math.abs(reading - history[history.length - 1]) : 0;

        // Check stuck
        let stuckStreak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (Math.abs(history[i] - reading) < 1e-4) stuckStreak++;
            else break;
        }

        // Peer concordance
        const peerValues = Object.values(peerReadings);
        const peerCount = peerValues.length;
        const peerMedian = peerCount > 0 ? peerValues.sort((a,b)=>a-b)[Math.floor(peerCount / 2)] : mean;
        const peerResidual = Math.abs(reading - peerMedian);

        let faultClass = 'NORMAL';
        let isGenuine = false;
        let anomalyScore = 0.05;
        let confidence = 0.92;
        const evidence = [];

        // Genuine Environmental Event
        if (peerCount >= 2 && peerResidual < 2.5 && (reading < -35.0 || lastDiff > 4.0)) {
            faultClass = 'GENUINE_ENVIRONMENTAL_EVENT';
            isGenuine = true;
            anomalyScore = 0.22;
            confidence = 0.95;
            evidence.push({
                factor: 'Peer Spatial Concordance',
                value: `${peerCount} peer channels shifted in physical alignment`,
                impact: 'Confirms genuine ambient weather event, preserving sensor trust',
                scoreDelta: 0
            });
        } else if (stuckStreak >= 8) {
            faultClass = 'FROZEN_STUCK';
            anomalyScore = 0.88;
            confidence = 0.96;
            evidence.push({
                factor: 'Zero Variance Lockup',
                value: `Constant value for ${stuckStreak} cycles`,
                impact: 'Sensor transducer stuck-at condition detected',
                scoreDelta: -45.0
            });
        } else if (lastDiff > 12.0 && peerResidual > 6.0) {
            faultClass = 'SUDDEN_SPIKE';
            anomalyScore = 0.82;
            confidence = 0.90;
            evidence.push({
                factor: 'Impulse Step Anomaly',
                value: `Delta of ${lastDiff.toFixed(1)} ${sensor.unit}`,
                impact: 'Transient electrical spike without physical basis',
                scoreDelta: -32.0
            });
        } else if (std > 3.0) {
            faultClass = 'EXCESSIVE_NOISE';
            anomalyScore = 0.75;
            confidence = 0.88;
            evidence.push({
                factor: 'Excessive Signal Jitter',
                value: `Moving std dev = ${std.toFixed(2)} ${sensor.unit}`,
                impact: 'Sensor circuit noise degradation',
                scoreDelta: -28.0
            });
        } else if (peerCount >= 1 && peerResidual > 5.0) {
            faultClass = 'GRADUAL_DRIFT';
            anomalyScore = 0.74;
            confidence = 0.89;
            evidence.push({
                factor: 'Peer Calibration Divergence',
                value: `Diverges by ${peerResidual.toFixed(1)} ${sensor.unit} from peer consensus`,
                impact: 'Thermocouple junction calibration drift',
                scoreDelta: -30.0
            });
        } else if (lastDiff > 8.0) {
            faultClass = 'RATE_OF_CHANGE_ANOMALY';
            anomalyScore = 0.70;
            confidence = 0.85;
            evidence.push({
                factor: 'Rate of Change Violation',
                value: `Step rate of ${lastDiff.toFixed(1)} ${sensor.unit}/cycle`,
                impact: 'Exceeds physical rate limit of monitored process',
                scoreDelta: -25.0
            });
        }

        // Trust calculation
        let trust = 100.0;
        if (isGenuine) {
            trust = Math.max(90.0, 100.0 - peerResidual * 1.5);
        } else if (faultClass === 'NORMAL') {
            trust = Math.max(88.0, 100.0 - (std * 2.5 + peerResidual * 0.5));
            evidence.push({
                factor: 'Signal Stability',
                value: `Normal physical variance (${std.toFixed(2)} ${sensor.unit})`,
                impact: 'Signal verified nominal and trustworthy',
                scoreDelta: 0
            });
        } else {
            evidence.forEach(e => { trust += (e.scoreDelta || -20); });
        }
        trust = Math.max(0, Math.min(100, Math.round(trust)));

        let status = 'HEALTHY';
        if (trust < 60) status = 'CONFIRMED_FAULT';
        else if (trust < 85 && !isGenuine) status = 'SUSPECTED_FAULT';

        return {
            sensorId: sensor.sensorId,
            status,
            faultClass,
            isGenuineEvent: isGenuine,
            trustScore: trust,
            anomalyScore: Number(anomalyScore.toFixed(3)),
            confidence: Number(confidence.toFixed(3)),
            explanation: isGenuine 
                ? `Ambient weather transition verified by ${peerCount} peer channels. Sensor health intact.`
                : (evidence[0]?.impact || 'Operating nominally.'),
            evidence,
            latencyMs: Date.now() - start
        };
    }

    async _createOrUpdateSensorAlert(sensor, evalResult) {
        // Prevent duplicate active alerts on same sensor
        let alert = await Alert.findOne({
            sensorId: sensor.sensorId,
            status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
        });

        const severity = evalResult.trustScore < 50 ? 'CRITICAL' : evalResult.trustScore < 75 ? 'HIGH' : 'MEDIUM';
        const msg = `${sensor.name} (${sensor.sensorId}): Suspected ${evalResult.faultClass.replace('_', ' ').toLowerCase()} (Trust: ${evalResult.trustScore}%)`;

        if (!alert) {
            alert = await Alert.create({
                stationId: sensor.stationId,
                assetId: sensor.assetId,
                assetName: sensor.assetCode || 'Monitored Subsystem',
                sensorId: sensor.sensorId,
                sensorName: sensor.name,
                sensorType: sensor.type,
                type: 'SENSOR_FAULT',
                severity,
                riskLevel: severity,
                anomalyScore: evalResult.anomalyScore,
                trustScore: evalResult.trustScore,
                faultClass: evalResult.faultClass,
                isGenuineEvent: false,
                modelConfidence: evalResult.confidence,
                message: msg,
                explanation: evalResult.explanation,
                evidence: evalResult.evidence,
                relatedSensorsConsidered: sensor.relatedSensors || [],
                affectedAssets: sensor.downstreamAssets || [],
                recommendedAction: evalResult.faultClass === 'GRADUAL_DRIFT'
                    ? 'Recalibrate sensor transducer and inspect cable shielding.'
                    : evalResult.faultClass === 'FROZEN_STUCK'
                    ? 'Check transducer power supply and reset ADC input bus.'
                    : 'Inspect physical channel for connection intermittent fault.',
                status: 'ACTIVE',
                timelineEvents: [{
                    time: new Date(),
                    title: `Sensor Fault Flagged: ${evalResult.faultClass}`,
                    description: `Trust score dropped to ${evalResult.trustScore}%. ${evalResult.explanation}`,
                    type: 'alert'
                }]
            });
        } else {
            alert.trustScore = evalResult.trustScore;
            alert.anomalyScore = evalResult.anomalyScore;
            alert.faultClass = evalResult.faultClass;
            alert.explanation = evalResult.explanation;
            alert.evidence = evalResult.evidence;
            await alert.save();
        }
        return alert;
    }

    async _createGenuineEventAlert(sensor, evalResult) {
        // Find if genuine event alert already exists
        let alert = await Alert.findOne({
            stationId: sensor.stationId,
            type: 'GENUINE_ENVIRONMENTAL_EVENT',
            status: 'ACTIVE'
        });

        if (!alert) {
            alert = await Alert.create({
                stationId: sensor.stationId,
                assetId: sensor.assetId,
                assetName: 'Antarctic Meteorological Complex',
                sensorId: sensor.sensorId,
                sensorName: sensor.name,
                sensorType: sensor.type,
                type: 'GENUINE_ENVIRONMENTAL_EVENT',
                severity: 'LOW',
                riskLevel: 'LOW',
                anomalyScore: evalResult.anomalyScore,
                trustScore: evalResult.trustScore,
                faultClass: 'GENUINE_ENVIRONMENTAL_EVENT',
                isGenuineEvent: true,
                modelConfidence: evalResult.confidence,
                message: `Genuine Environmental Event: Cross-sensor consensus confirmed physical weather transition across all peer sensors. No sensor fault.`,
                explanation: evalResult.explanation,
                evidence: evalResult.evidence,
                relatedSensorsConsidered: sensor.relatedSensors || [],
                affectedAssets: sensor.downstreamAssets || [],
                recommendedAction: 'No maintenance action needed. Maintain thermal vigilance and observe station heating load.',
                status: 'ACTIVE',
                timelineEvents: [{
                    time: new Date(),
                    title: 'Genuine Polar Weather Transition Confirmed',
                    description: 'Cross-sensor spatial agreement verified ambient drop without hardware faults.',
                    type: 'info'
                }]
            });
        }
        return alert;
    }

    /**
     * Executes reproducible demo scenarios.
     */
    async injectScenario(scenarioType, targetSensorId = 'SEN-TEMP-ENV-01') {
        const sensor = await Sensor.findOne({ sensorId: targetSensorId });
        if (!sensor) throw new Error(`Target sensor ${targetSensorId} not found`);

        const now = Date.now();
        let targetValue = sensor.currentReading;
        let peerOverrides = {};

        switch (scenarioType) {
            case 'GRADUAL_DRIFT':
                // Single sensor drifts +8.5°C while peers stay steady at -28°C
                targetValue = -19.5;
                peerOverrides = { 'SEN-TEMP-ENV-02': -28.2, 'SEN-TEMP-ENV-03': -28.0 };
                break;

            case 'SUDDEN_SPIKE':
                targetValue = sensor.type === 'VIBRATION' ? 2.45 : 14.8;
                break;

            case 'FROZEN_STUCK':
                // Constant value across 10 steps
                targetValue = -26.40;
                break;

            case 'EXCESSIVE_NOISE':
                targetValue = -28.0 + (Math.random() - 0.5) * 16.0;
                break;

            case 'MISSING_DROPOUT':
                targetValue = null;
                break;

            case 'GENUINE_ENVIRONMENTAL_EVENT':
                // Blizzard drops ALL ambient sensors to -42°C in consensus!
                targetValue = -42.5;
                peerOverrides = { 'SEN-TEMP-ENV-02': -42.2, 'SEN-TEMP-ENV-03': -42.8 };
                break;

            case 'COMBINED_EVENT_FAULT':
                // Ambient drop to -42°C, BUT this target sensor is frozen stuck at -20°C
                targetValue = -20.0;
                peerOverrides = { 'SEN-TEMP-ENV-02': -42.2, 'SEN-TEMP-ENV-03': -42.8 };
                break;

            case 'RESET_NOMINAL':
                targetValue = sensor.nominalRange?.typical || -28.0;
                peerOverrides = { 'SEN-TEMP-ENV-02': -28.1, 'SEN-TEMP-ENV-03': -28.0 };
                break;

            default:
                targetValue = sensor.currentReading;
        }

        // Apply peer overrides if any
        for (const [pId, pVal] of Object.entries(peerOverrides)) {
            const peer = await Sensor.findOne({ sensorId: pId });
            if (peer) {
                peer.currentReading = pVal;
                await peer.save();
            }
        }

        return await this.evaluateAndIngestReading(targetSensorId, targetValue);
    }
}

module.exports = new SensorIntelligenceService();
