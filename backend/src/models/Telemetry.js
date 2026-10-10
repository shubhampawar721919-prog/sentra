const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    sensorId: { type: String, index: true },
    sensorRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
    timestamp: { type: Date, default: Date.now, index: true },
    
    // Direct sensor reading
    rawReading: Number,
    groundTruthLabel: { type: String, default: 'NORMAL' },
    isSynthetic: { type: Boolean, default: false },
    scenarioId: { type: String, default: null },

    // Multichannel asset measurements (backward compatible)
    temperature: Number,
    pressure: Number,
    humidity: Number,
    vibration: Number,
    powerOutput: Number,
    fuelLevel: Number,
    batteryVoltage: Number,
    generatorLoad: Number,
    coolantTemperature: Number
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);
