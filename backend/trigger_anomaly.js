const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Asset = require('./src/models/Asset');
const Telemetry = require('./src/models/Telemetry');
const intelligenceService = require('./src/services/intelligenceService');
const alertCreationService = require('./src/services/alertCreationService');

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/polaris';
const targetAssetId = process.argv[2] || 'DG-001';

async function triggerAnomaly() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');

    const asset = await Asset.findOne({ assetId: targetAssetId });
    if (!asset) {
      console.log(`Asset ${targetAssetId} not found.`);
      process.exit(1);
    }

    console.log(`Injecting CRITICAL anomaly into ${targetAssetId}...`);

    // Insert anomalous telemetry
    const badTelemetry = await Telemetry.create({
      assetId: asset._id,
      temperature: 145.5, // Extremely high
      vibration: 1.85,    // Extremely high
      powerOutput: 85,    // Failing
      generatorLoad: 95,
      batteryVoltage: 18.5,
      fuelLevel: 5.0
    });

    console.log('Telemetry injected. Requesting Intelligence from ML Engine...');

    // Wait 1 sec for ML to be ready just in case
    await new Promise(r => setTimeout(r, 1000));

    const intelligence = await intelligenceService.getUnifiedIntelligence(targetAssetId, badTelemetry.toJSON());
    
    console.log('\n--- ML RESPONSE ---');
    console.log('Risk Level:', intelligence.risk?.level);
    console.log('Failure Probability:', intelligence.failurePrediction?.probability);
    console.log('Cascade Impact:', intelligence.cascade?.cascadeRisks?.map(r => `${r.assetId} (${r.level})`).join(', '));
    console.log('Action:', intelligence.decision?.action);
    console.log('-------------------\n');

    console.log('Triggering Alert Generation Pipeline...');
    // We mock io for the script
    const mockIo = { emit: (event, data) => console.log(`[Socket] emitted ${event}`) };
    await alertCreationService.evaluateAndCreateAlert(mockIo, asset, intelligence);

    console.log('\nSuccess! Anomaly injected and alerts generated. Check your dashboard!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

triggerAnomaly();
