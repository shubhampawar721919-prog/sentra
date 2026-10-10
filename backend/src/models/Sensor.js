const mongoose = require('mongoose');

const SensorSchema = new mongoose.Schema({
    sensorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['TEMPERATURE', 'VIBRATION', 'POWER', 'PRESSURE', 'HUMIDITY', 'VOLTAGE', 'FLOW'],
        required: true 
    },
    unit: { type: String, required: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    assetCode: { type: String, default: '' },
    assetName: { type: String, default: '' },
    location: { type: String, default: 'Station Complex' },
    relatedSensors: [{ type: String }],
    
    // Real-time telemetry & assessment
    currentReading: { type: Number, default: 0 },
    lastSeen: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['HEALTHY', 'SUSPECTED_FAULT', 'CONFIRMED_FAULT', 'STALE_MISSING', 'UNCERTAIN'],
        default: 'HEALTHY' 
    },
    trustScore: { type: Number, default: 95.0, min: 0, max: 100 },
    anomalyScore: { type: Number, default: 0.05, min: 0, max: 1 },
    faultClass: { 
        type: String, 
        enum: [
            'NORMAL', 
            'GRADUAL_DRIFT', 
            'SUDDEN_SPIKE', 
            'FROZEN_STUCK', 
            'EXCESSIVE_NOISE', 
            'MISSING_DROPOUT', 
            'RATE_OF_CHANGE_ANOMALY', 
            'GENUINE_ENVIRONMENTAL_EVENT', 
            'UNCERTAIN_AMBIGUOUS'
        ],
        default: 'NORMAL' 
    },
    isGenuineEvent: { type: Boolean, default: false },
    modelConfidence: { type: Number, default: 0.94, min: 0, max: 1 },
    
    // Explainability & Diagnostics
    explanation: { type: String, default: 'Operating nominally within standard statistical tolerance.' },
    evidence: [{
        factor: { type: String, required: true },
        value: { type: String, required: true },
        impact: { type: String, required: true },
        scoreDelta: { type: Number, default: 0 }
    }],
    
    // Recent timeseries buffer (last 60 samples for immediate visualization)
    recentReadings: [{
        timestamp: { type: Date, default: Date.now },
        value: Number,
        anomalyScore: Number,
        isAnomaly: Boolean,
        faultClass: String,
        trustScore: Number
    }],
    
    nominalRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100 },
        typical: { type: Number, default: 50 }
    },
    downstreamAssets: [{ type: String }],
    metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Sensor', SensorSchema);
