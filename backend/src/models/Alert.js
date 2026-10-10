const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    assetName: String,
    
    // Sensor intelligence attribution
    sensorId: { type: String, index: true },
    sensorName: String,
    sensorType: String,
    
    type: { type: String, default: 'SENSOR_FAULT' },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    riskLevel: String,
    
    // Core SENTRA metrics
    anomalyScore: Number,
    trustScore: Number,
    failureProbability: Number,
    decisionPriority: String,
    
    // Fault classification & context reasoning
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
            'UNCERTAIN_AMBIGUOUS',
            'OPERATIONAL'
        ],
        default: 'GRADUAL_DRIFT' 
    },
    isGenuineEvent: { type: Boolean, default: false },
    modelConfidence: Number,
    
    message: String,
    explanation: String,
    evidence: [{
        factor: String,
        value: String,
        observation: String,
        impact: String
    }],
    relatedSensorsConsidered: [{ type: String }],
    recommendedAction: { type: String, default: 'Verify sensor calibration and inspect channel wiring.' },
    
    affectedAssets: [String],
    status: { type: String, enum: ['ACTIVE', 'ACKNOWLEDGED', 'ACTION_PLANNED', 'RESOLVED'], default: 'ACTIVE' },
    operatorNotes: { type: String, default: '' },
    
    metadata: Object,
    acknowledgedAt: Date,
    actionPlannedAt: Date,
    actionPlan: Object,
    resolvedAt: Date,
    timelineEvents: [{
        time: { type: Date, default: Date.now },
        title: String,
        description: String,
        type: { type: String, default: 'info' }
    }],
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', AlertSchema);
