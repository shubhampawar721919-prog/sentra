/**
 * seedMaitri2.js
 * 
 * Seeds Maitri-II (MTR2) into MongoDB.
 * Represents India's upcoming next-generation polar research station
 * sanctioned by the Ministry of Earth Sciences (MoES) for commissioning by 2029.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Station = require('../models/Station');
const Asset = require('../models/Asset');
const Telemetry = require('../models/Telemetry');

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/polaris';

const maitri2Assets = [
  { assetId: 'M2-WIND-01', name: 'Northern Polar Wind Turbine (120kW)', type: 'Wind Turbine', status: 'NORMAL', criticality: 'CRITICAL', metadata: { model: 'EWT-DW54-Polar', capacity: '120kW' } },
  { assetId: 'M2-SOLAR-01', name: 'Austral High-Albedo Solar PV Array (80kW)', type: 'Solar Array', status: 'NORMAL', criticality: 'HIGH', metadata: { capacity: '80kW', type: 'Bifacial Polar' } },
  { assetId: 'M2-H2-01', name: 'Green Hydrogen Fuel Cell Backup (100kW)', type: 'Fuel Cell', status: 'NORMAL', criticality: 'CRITICAL', metadata: { capacity: '100kW', type: 'PEM Fuel Cell' } },
  { assetId: 'M2-BESS-01', name: 'Liquid-Cooled Battery Storage BESS (1.2MWh)', type: 'Battery System', status: 'NORMAL', criticality: 'CRITICAL', metadata: { capacity: '1200kWh', chemistry: 'LiFePO4' } },
  { assetId: 'M2-HVAC-01', name: 'Geothermal Ground-Loop & Waste Heat HVAC', type: 'HVAC', status: 'NORMAL', criticality: 'CRITICAL', metadata: { zone: 'Maitri-II Complex' } },
  { assetId: 'M2-PUMP-01', name: 'Dual Trace-Heated Lake Water Pump', type: 'Pump', status: 'NORMAL', criticality: 'HIGH', metadata: { flowRate: '160L/m' } },
  { assetId: 'M2-COM-01', name: 'Dual Ka/Ku High-Throughput Radome', type: 'Communications', status: 'NORMAL', criticality: 'CRITICAL', metadata: { band: 'Ka/Ku Dual Band' } },
  { assetId: 'M2-AWS-01', name: 'Maitri-II Automatic Polar Weather Observatory', type: 'Environmental Sensor', status: 'NORMAL', criticality: 'MEDIUM', metadata: { elevation: '125m' } },
  { assetId: 'M2-HAB-01', name: 'Primary Habitat & Command Core', type: 'Habitation', status: 'NORMAL', criticality: 'CRITICAL', metadata: { zone: 'Habitat Sector' } },
  { assetId: 'M2-LAB-01', name: 'Life Sciences & Ice Core Lab', type: 'Laboratory', status: 'NORMAL', criticality: 'HIGH', metadata: { zone: 'Science Sector' } }
];

async function seedMaitri2() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB for Maitri-II seed...');

    let maitri2 = await Station.findOne({ code: 'MTR2' });
    if (!maitri2) {
      maitri2 = await Station.create({
        name: 'Maitri-II (Next-Gen Station)',
        code: 'MTR2',
        location: 'Schirmacher Oasis (Eastern Sector), Antarctica',
        coordinates: { latitude: -70.7580, longitude: 11.7520 },
        status: 'ONLINE',
        environment: 'Inland Polar Microgrid (Zero Carbon Blueprint)'
      });
      console.log('✓ Created Maitri-II Station Document.');
    } else {
      console.log('Maitri-II Station document exists.');
    }

    // Clean existing MTR2 assets
    await Asset.deleteMany({ stationId: maitri2._id });

    console.log('Inserting Maitri-II Green Microgrid Assets...');
    const inserted = [];
    for (const a of maitri2Assets) {
      const doc = await Asset.create({ ...a, stationId: maitri2._id });
      inserted.push(doc);
    }

    const now = Date.now();
    console.log('Generating 24-hour Telemetry for Maitri-II...');
    for (const asset of inserted) {
      const docs = [];
      for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(now - i * 3600000);
        let doc = {
          assetId: asset._id,
          timestamp,
          temperature: 0,
          pressure: 1008,
          humidity: 40,
          vibration: 0.05,
          powerOutput: 0,
          generatorLoad: 0,
          batteryVoltage: 48.0,
          fuelLevel: 95.0,
          coolantTemperature: 25.0
        };

        if (asset.assetId === 'M2-WIND-01') {
          doc.powerOutput = 105 + Math.sin(i) * 12;
          doc.temperature = -28.0;
          doc.vibration = 0.12;
          doc.generatorLoad = 78;
        } else if (asset.assetId === 'M2-SOLAR-01') {
          doc.powerOutput = 65 + Math.cos(i) * 15;
          doc.temperature = -25.0;
        } else if (asset.assetId === 'M2-H2-01') {
          doc.powerOutput = 85;
          doc.temperature = 42.0;
          doc.coolantTemperature = 48.0;
          doc.fuelLevel = 92.0; // H2 storage level
        } else if (asset.assetId === 'M2-BESS-01') {
          doc.batteryVoltage = 52.4;
          doc.temperature = 18.0;
        } else if (asset.assetId === 'M2-HVAC-01') {
          doc.temperature = 21.0;
          doc.powerOutput = 45;
        } else if (asset.assetId === 'M2-AWS-01') {
          doc.temperature = -29.5;
        }

        docs.push(doc);
      }
      await Telemetry.insertMany(docs);
    }

    console.log('✓ Successfully seeded Maitri-II and all microgrid telemetry!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Maitri-II:', err);
    process.exit(1);
  }
}

seedMaitri2();
