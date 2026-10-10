const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');
const Station = require('./src/models/Station');
const Asset = require('./src/models/Asset');
const Telemetry = require('./src/models/Telemetry');
const Alert = require('./src/models/Alert');

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/polaris');
        console.log('Connected to MongoDB');
        
        // Clear existing data EXCEPT MTR2 which is handled by seedMaitri2.js
        await User.deleteMany();
        await Station.deleteMany({ code: { $in: ['BHR', 'MTR'] } });
        
        const bhrStation = await Station.findOne({ code: 'BHR' });
        if (bhrStation) await Asset.deleteMany({ stationId: bhrStation._id });
        const mtrStation = await Station.findOne({ code: 'MTR' });
        if (mtrStation) await Asset.deleteMany({ stationId: mtrStation._id });
        // NOTE: Actually let's just clear assets for those stations
        // We will just do a clean wipe for BHR and MTR.

        console.log('Cleared existing data for BHR and MTR');
        
        // 1. Users
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        await User.create({
            name: 'Cmdr. Sharma',
            email: 'admin@polaris.gov',
            password: passwordHash,
            role: 'ADMIN'
        });
        
        // 2. Stations
        const s1 = await Station.create({
            name: 'Bharati',
            code: 'BHR',
            location: 'Larseman Hills, Antarctica',
            coordinates: { latitude: -69.4058, longitude: 76.1907 },
            status: 'OPERATIONAL',
            environment: 'Coastal'
        });
        
        const s2 = await Station.create({
            name: 'Maitri',
            code: 'MTR',
            location: 'Schirmacher Oasis, Antarctica',
            coordinates: { latitude: -70.7667, longitude: 11.7333 },
            status: 'OPERATIONAL',
            environment: 'Inland'
        });
        
        // 3. Assets for Bharati (Matching BHARATI_DEPENDENCIES exactly)
        const bharatiAssets = [
            { assetId: 'FUEL-01', name: 'Primary Fuel Reservoir', type: 'Fuel Storage', status: 'NORMAL', criticality: 'CRITICAL' },
            { assetId: 'DG-001', name: 'Primary Diesel Generator', type: 'Diesel Generator', status: 'WARNING', criticality: 'CRITICAL' },
            { assetId: 'DG-002', name: 'Secondary Diesel Generator', type: 'Diesel Generator', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'BAT-01', name: 'UPS Battery Bank A', type: 'Battery System', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'BAT-02', name: 'UPS Battery Bank B', type: 'Battery System', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'BAT-03', name: 'UPS Battery Bank C', type: 'Battery System', status: 'NORMAL', criticality: 'MEDIUM' },
            { assetId: 'HVAC-01', name: 'Main Climate Control', type: 'HVAC', status: 'NORMAL', criticality: 'CRITICAL' },
            { assetId: 'HVAC-02', name: 'Secondary Climate Control', type: 'HVAC', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'HVAC-03', name: 'Auxiliary HVAC', type: 'HVAC', status: 'NORMAL', criticality: 'MEDIUM' },
            { assetId: 'PUMP-01', name: 'Cooling Pump Alpha', type: 'Pump', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'PUMP-02', name: 'Cooling Pump Beta', type: 'Pump', status: 'NORMAL', criticality: 'MEDIUM' },
            { assetId: 'COM-01', name: 'Satcom Uplink Array', type: 'Communications', status: 'NORMAL', criticality: 'CRITICAL' }
        ];

        const insertedBHR = [];
        for (const a of bharatiAssets) {
            const doc = await Asset.create({ ...a, stationId: s1._id });
            insertedBHR.push(doc);
        }
        
        // Assets for Maitri (Matching MAITRI_DEPENDENCIES exactly)
        const maitriAssets = [
            { assetId: 'MTR-FUEL-01', name: 'Maitri Fuel Supply', type: 'Fuel Storage', status: 'NORMAL', criticality: 'CRITICAL' },
            { assetId: 'MTR-DG-01', name: 'Maitri Primary Gen', type: 'Diesel Generator', status: 'NORMAL', criticality: 'CRITICAL' },
            { assetId: 'MTR-DG-02', name: 'Maitri Backup Gen', type: 'Backup Generator', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'MTR-BAT-01', name: 'Maitri Battery Reserve', type: 'Battery System', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'MTR-HVAC-01', name: 'Maitri Climate Unit', type: 'HVAC', status: 'NORMAL', criticality: 'CRITICAL' },
            { assetId: 'MTR-PUMP-01', name: 'Maitri Thermal Pump', type: 'Pump', status: 'NORMAL', criticality: 'HIGH' },
            { assetId: 'MTR-ENV-01', name: 'Maitri Weather Station', type: 'Environmental Sensor', status: 'NORMAL', criticality: 'MEDIUM' }
        ];

        for (const a of maitriAssets) {
            await Asset.create({ ...a, stationId: s2._id });
        }
        
        // 4. Telemetry for DG-001 (Bharati)
        const dg001 = insertedBHR.find(a => a.assetId === 'DG-001');
        const now = Date.now();
        const telemetryDocs = [];
        for (let i = 24; i >= 0; i--) {
            const isAnomaly = i === 2; // Spike 2 hours ago
            telemetryDocs.push({
                assetId: dg001._id,
                timestamp: new Date(now - i * 3600000),
                temperature: isAnomaly ? 65.5 : (45 + Math.random() * 5),
                vibration: isAnomaly ? 0.45 : (0.15 + Math.random() * 0.1),
                powerOutput: 480 + Math.random() * 20,
                fuelLevel: 85 - (24 - i) * 0.5,
                generatorLoad: 80 + Math.random() * 10
            });
        }
        await Telemetry.insertMany(telemetryDocs);
        
        // 5. Alerts
        await Alert.create({
            stationId: s1._id,
            assetId: dg001._id,
            type: 'VIBRATION_ANOMALY',
            severity: 'HIGH',
            message: 'DG-001 vibration spiked to 0.45 mm/s',
            status: 'ACTIVE',
            timestamp: new Date(now - 2 * 3600000)
        });
        
        const hvac01 = insertedBHR.find(a => a.assetId === 'HVAC-01');
        await Alert.create({
            stationId: s1._id,
            assetId: hvac01._id,
            type: 'MAINTENANCE_REQUIRED',
            severity: 'MEDIUM',
            message: 'HVAC-01 filter replacement due',
            status: 'ACKNOWLEDGED',
            timestamp: new Date(now - 24 * 3600000)
        });
        
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}
seed();
