const mongoose = require('mongoose');

const EvaluationResultSchema = new mongoose.Schema({
    modelName: { type: String, default: 'SENTRA Sensor Intelligence Ensemble' },
    modelVersion: { type: String, default: 'v1.4-ensemble' },
    datasetSplit: { type: String, default: '60% Train / 20% Val / 20% Held-Out Test' },
    totalTestSamples: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    
    // Overall metrics
    metrics: {
        accuracy: Number,
        precision: Number,
        recall: Number,
        macroF1: Number,
        falseAlarmRate: Number,          // False alarms per 100 nominal/genuine samples
        genuineEventRecall: Number,      // Recall on true environmental events
        avgDetectionDelaySteps: Number,  // Timesteps before fault triggered
        avgInferenceLatencyMs: Number    // Inference time per sample in milliseconds
    },
    
    // Per-class metrics
    classMetrics: [{
        faultClass: String,
        precision: Number,
        recall: Number,
        f1Score: Number,
        support: Number
    }],
    
    // Confusion Matrix: labels and 2D matrix
    confusionMatrix: {
        labels: [String],
        matrix: [[Number]]
    },
    
    // Direct head-to-head comparison with naive rule-based thresholding
    baselineComparison: {
        naiveThreshold: {
            precision: Number,
            recall: Number,
            macroF1: Number,
            falseAlarmRate: Number,
            genuineEventRecall: Number
        },
        sentraML: {
            precision: Number,
            recall: Number,
            macroF1: Number,
            falseAlarmRate: Number,
            genuineEventRecall: Number
        },
        falseAlarmReductionPercent: Number
    },
    
    assumptions: [String]
}, { timestamps: true });

module.exports = mongoose.model('EvaluationResult', EvaluationResultSchema);
