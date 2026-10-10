const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Station = require('./src/models/Station');
const Asset = require('./src/models/Asset');
const Telemetry = require('./src/models/Telemetry');
const Alert = require('./src/models/Alert');

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/polaris';

const bharatiAssets = [
  { assetId: 'FUEL-01', name: 'Primary Fuel Reservoir', type: 'Fuel System', status: 'NORMAL', criticality: 'CRITICAL', metadata: { capacity: '50000L' } },
  { assetId: 'DG-001', name: 'Primary Diesel Generator', type: 'Generator', status: 'NORMAL', criticality: 'CRITICAL', metadata: { model: 'CAT-C32', capacity: '1000kW' } },
  { assetId: 'DG-002', name: 'Secondary Diesel Generator', type: 'Generator', status: 'NORMAL', criticality: 'HIGH', metadata: { model: 'CAT-C18', capacity: '600kW' } },
  { assetId: 'BAT-01', name: 'Alpha Battery Bank', type: 'Battery System', status: 'NORMAL', criticality: 'HIGH', metadata: { capacity: '500kWh' } },
  { assetId: 'BAT-02', name: 'Beta Battery Bank', type: 'Battery System', status: 'NORMAL', criticality: 'MEDIUM', metadata: { capacity: '250kWh' } },
  { assetId: 'HVAC-01', name: 'Lab Cooling Unit', type: 'HVAC', status: 'NORMAL', criticality: 'HIGH', metadata: { zone: 'Laboratory' } },
  { assetId: 'HVAC-02', name: 'Server Room Chiller', type: 'HVAC', status: 'NORMAL', criticality: 'CRITICAL', metadata: { zone: 'Data Center' } },
  { assetId: 'HVAC-03', name: 'Crew Quarters HVAC', type: 'HVAC', status: 'NORMAL', criticality: 'MEDIUM', metadata: { zone: 'Living Area' } },
  { assetId: 'PUMP-01', name: 'Main Coolant Pump', type: 'Pump', status: 'NORMAL', criticality: 'HIGH', metadata: { flowRate: '150L/m' } },
  { assetId: 'PUMP-02', name: 'Secondary Coolant Pump', type: 'Pump', status: 'NORMAL', criticality: 'MEDIUM', metadata: { flowRate: '100L/m' } },
  { assetId: 'COM-01', name: 'Satellite Uplink', type: 'Communications', status: 'NORMAL', criticality: 'CRITICAL', metadata: { band: 'Ku-Band' } },
  { assetId: 'ENV-01', name: 'Automated Weather Station', type: 'Environmental Sensor', status: 'NORMAL', criticality: 'MEDIUM', metadata: { model: 'Vaisala AWS310', elevation: '35m' } },
];

const maitriAssets = [
  { assetId: 'MTR-FUEL-01', name: 'Maitri Main Fuel Storage', type: 'Fuel System', status: 'NORMAL', criticality: 'CRITICAL', metadata: { capacity: '60000L' } },
  { assetId: 'MTR-DG-01', name: 'Maitri Primary Generator', type: 'Generator', status: 'NORMAL', criticality: 'CRITICAL', metadata: { model: 'Kirloskar-800', capacity: '800kW' } },
  { assetId: 'MTR-DG-02', name: 'Maitri Auxiliary Generator', type: 'Generator', status: 'NORMAL', criticality: 'HIGH', metadata: { model: 'Kirloskar-400', capacity: '400kW' } },
  { assetId: 'MTR-BAT-01', name: 'Maitri Storage Bank', type: 'Battery System', status: 'NORMAL', criticality: 'HIGH', metadata: { capacity: '400kWh' } },
  { assetId: 'MTR-HVAC-01', name: 'Maitri Life Support HVAC', type: 'HVAC', status: 'NORMAL', criticality: 'CRITICAL', metadata: { zone: 'Station Complex' } },
  { assetId: 'MTR-PUMP-01', name: 'Priyadarshini Lake Water Pump', type: 'Pump', status: 'NORMAL', criticality: 'HIGH', metadata: { flowRate: '120L/m' } },
  { assetId: 'MTR-ENV-01', name: 'Maitri Meteorological Station', type: 'Environmental Sensor', status: 'NORMAL', criticality: 'MEDIUM', metadata: { elevation: '117m' } },
];

async function seed() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure Stations
    let bharati = await Station.findOne({ code: 'BHR' });
    if (!bharati) {
      bharati = await Station.create({
        name: 'Bharati',
        code: 'BHR',
        location: 'Larsemann Hills, Antarctica',
        coordinates: { latitude: -69.4058, longitude: 76.1907 },
        status: 'ONLINE',
        environment: 'Coastal Antarctic'
      });
    }

    let maitri = await Station.findOne({ code: 'MTR' });
    if (!maitri) {
      maitri = await Station.create({
        name: 'Maitri',
        code: 'MTR',
        location: 'Schirmacher Oasis, Antarctica',
        coordinates: { latitude: -70.7667, longitude: 11.7333 },
        status: 'ONLINE',
        environment: 'Inland Antarctic'
      });
    }

    console.log('Clearing old assets, telemetry, and alerts...');
    await Asset.deleteMany({});
    await Telemetry.deleteMany({});
    await Alert.deleteMany({});

    const now = Date.now();

    // 2. Seed Bharati Assets & Telemetry
    console.log('Inserting Bharati Assets...');
    const insertedBharati = [];
    for (const a of bharatiAssets) {
      const doc = await Asset.create({ ...a, stationId: bharati._id });
      insertedBharati.push(doc);
    }

    console.log('Generating Bharati 24-hour Telemetry...');
    for (const asset of insertedBharati) {
      const telemetryDocs = [];
      for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(now - i * 3600000);
        let doc = {
          assetId: asset._id,
          timestamp: timestamp,
          temperature: 0,
          pressure: 1013,
          humidity: 45,
          vibration: 0,
          powerOutput: 0,
          generatorLoad: 0,
          batteryVoltage: 0,
          fuelLevel: 0,
          coolantTemperature: 0
        };

        if (asset.assetId === 'ENV-01') {
          if (i === 0) {
            doc.temperature = -30.5;
            doc.pressure = 982;
            doc.humidity = 65;
          } else {
            const diurnal = Math.sin(((24 - i) / 24) * Math.PI * 2) * 3;
            doc.temperature = Number((-30.5 + diurnal).toFixed(1));
            doc.pressure = Math.round(982 + ((24 - i) % 5));
            doc.humidity = Math.round(62 + ((24 - i) % 6));
          }
        } else if (asset.assetId === 'FUEL-01') {
          const fuelDrawdown = (24 - i) * 0.15833;
          doc.fuelLevel = Number((76.8 - fuelDrawdown).toFixed(2));
          doc.temperature = -12.0;
        } else if (asset.assetId === 'DG-001') {
          const progress = (24 - i) / 24;
          if (i === 0) {
            doc.powerOutput = 492;
            doc.generatorLoad = 82;
            doc.temperature = 100.2;
            doc.vibration = 0.720;
            doc.coolantTemperature = 101.5;
            doc.batteryVoltage = 23.8;
            doc.fuelLevel = 73.0;
          } else {
            doc.powerOutput = Math.round(480 + progress * 12);
            doc.generatorLoad = Math.round(72 + progress * 10);
            doc.temperature = Number((82.0 + progress * 18.2).toFixed(1));
            doc.vibration = Number((0.220 + progress * 0.500).toFixed(3));
            doc.coolantTemperature = Number((84.0 + progress * 17.5).toFixed(1));
            doc.batteryVoltage = 23.8;
            doc.fuelLevel = 73.0;
          }
        } else if (asset.assetId === 'DG-002') {
          doc.powerOutput = 0;
          doc.generatorLoad = 0;
          doc.temperature = 34.0;
          doc.vibration = 0.01;
          doc.coolantTemperature = 35.0;
          doc.batteryVoltage = 24.2;
          doc.fuelLevel = 73.0;
        } else if (asset.type === 'Battery System') {
          doc.batteryVoltage = 24.2;
          doc.temperature = 21.0;
        } else if (asset.type === 'HVAC') {
          doc.powerOutput = 28;
          doc.temperature = 19.0;
          doc.vibration = 0.08;
        } else if (asset.type === 'Pump') {
          doc.powerOutput = 14;
          doc.temperature = 42.0;
          doc.vibration = 0.12;
        } else {
          doc.powerOutput = 10;
          doc.temperature = 22.0;
          doc.vibration = 0.05;
        }
        telemetryDocs.push(doc);
      }
      await Telemetry.insertMany(telemetryDocs);
    }

    // Seed verified active alert for Bharati DG-001
    const dg01 = insertedBharati.find(a => a.assetId === 'DG-001');
    if (dg01) {
      await Alert.create({
        stationId: bharati._id,
        assetId: dg01._id,
        assetName: dg01.name,
        type: 'Operational',
        severity: 'HIGH',
        riskLevel: 'HIGH',
        anomalyScore: 0.41,
        failureProbability: 0.68,
        decisionPriority: 'ACTION REQUIRED',
        message: 'Elevated bearing vibration (0.72 mm/s) and thermal stress detected.',
        explanation: 'Vibration harmonics show continuous upward drift across 24h baseline; XGBoost predicts 68% failure probability.',
        affectedAssets: ['BAT-01', 'BAT-02', 'HVAC-01', 'HVAC-02', 'PUMP-01', 'COM-01'],
        status: 'ACTIVE',
        timestamp: new Date(now - 1.5 * 3600000),
        timelineEvents: [
          { time: new Date(now - 2.5 * 3600000), title: 'Vibration Anomaly Detected', description: 'Vibration harmonic spiked above 0.35 mm/s baseline envelope', type: 'warning' },
          { time: new Date(now - 2.0 * 3600000), title: 'Failure Probability Elevated', description: 'XGBoost failure model crossed 50% operational threshold', type: 'warning' },
          { time: new Date(now - 1.5 * 3600000), title: 'Operational Alert Created', description: 'HIGH severity alert dispatched to polar operations console', type: 'alert' }
        ]
      });
    }

    // 3. Seed Maitri Assets & Telemetry (Nominal / Stable Station)
    console.log('Inserting Maitri Assets...');
    const insertedMaitri = [];
    for (const a of maitriAssets) {
      const doc = await Asset.create({ ...a, stationId: maitri._id });
      insertedMaitri.push(doc);
    }

    console.log('Generating Maitri 24-hour Telemetry...');
    for (const asset of insertedMaitri) {
      const telemetryDocs = [];
      for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(now - i * 3600000);
        let doc = {
          assetId: asset._id,
          timestamp: timestamp,
          temperature: 0,
          pressure: 995,
          humidity: 50,
          vibration: 0,
          powerOutput: 0,
          generatorLoad: 0,
          batteryVoltage: 0,
          fuelLevel: 0,
          coolantTemperature: 0
        };

        if (asset.assetId === 'MTR-ENV-01') {
          if (i === 0) {
            doc.temperature = -22.5;
            doc.pressure = 994;
            doc.humidity = 52;
          } else {
            const diurnal = Math.sin(((24 - i) / 24) * Math.PI * 2) * 2;
            doc.temperature = Number((-22.5 + diurnal).toFixed(1));
            doc.pressure = Math.round(994 + ((24 - i) % 4));
            doc.humidity = Math.round(52 + ((24 - i) % 5));
          }
        } else if (asset.assetId === 'MTR-FUEL-01') {
          const fuelDrawdown = (24 - i) * 0.14208;
          doc.fuelLevel = Number((87.5 - fuelDrawdown).toFixed(2));
          doc.temperature = -8.0;
        } else if (asset.assetId === 'MTR-DG-01') {
          if (i === 0) {
            doc.powerOutput = 492;
            doc.generatorLoad = 60;
            doc.temperature = 68.0;
            doc.vibration = 0.110;
            doc.coolantTemperature = 72.0;
            doc.fuelLevel = 84.0;
          } else {
            doc.powerOutput = 490;
            doc.generatorLoad = 60;
            doc.temperature = 68.0;
            doc.vibration = 0.110;
            doc.coolantTemperature = 72.0;
            doc.fuelLevel = 84.0;
          }
        } else if (asset.assetId === 'MTR-DG-02') {
          doc.powerOutput = 0;
          doc.generatorLoad = 0;
          doc.temperature = 28.0;
          doc.vibration = 0.01;
        } else if (asset.type === 'Battery System') {
          doc.batteryVoltage = 24.3;
          doc.temperature = 20.0;
        } else if (asset.type === 'HVAC') {
          doc.powerOutput = 24;
          doc.temperature = 20;
        } else {
          doc.powerOutput = 12;
          doc.temperature = 35;
        }
        telemetryDocs.push(doc);
      }
      await Telemetry.insertMany(telemetryDocs);
    }

    console.log('Seed Complete! Bharati (12 assets) & Maitri (7 assets) successfully populated.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
