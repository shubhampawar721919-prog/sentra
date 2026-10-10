import os

# Ensure dirs exist
os.makedirs("backend/src/middleware", exist_ok=True)
os.makedirs("backend/src/utils", exist_ok=True)

# 1. Models
with open("backend/src/models/User.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'OPERATOR', 'RESEARCHER'], default: 'OPERATOR' }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
""")

with open("backend/src/models/Station.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const StationSchema = new mongoose.Schema({
    name: String,
    code: String,
    location: String,
    coordinates: { latitude: Number, longitude: Number },
    status: { type: String, enum: ['OPERATIONAL', 'MAINTENANCE', 'OFFLINE'], default: 'OPERATIONAL' },
    environment: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('Station', StationSchema);
""")

with open("backend/src/models/Asset.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const AssetSchema = new mongoose.Schema({
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    name: String,
    assetId: String,
    type: String,
    status: { type: String, enum: ['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'], default: 'NORMAL' },
    criticality: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    specifications: Object
}, { timestamps: true });
module.exports = mongoose.model('Asset', AssetSchema);
""")

with open("backend/src/models/Telemetry.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const TelemetrySchema = new mongoose.Schema({
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    timestamp: { type: Date, default: Date.now },
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
""")

with open("backend/src/models/Alert.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const AlertSchema = new mongoose.Schema({
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    type: String,
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    message: String,
    status: { type: String, enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'], default: 'ACTIVE' },
    metadata: Object,
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Alert', AlertSchema);
""")

# 2. App.js (DB connection)
with open("backend/src/app.js", "w") as f:
    f.write("""const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/polaris')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/telemetry', require('./routes/telemetry'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/simulation', require('./routes/simulation'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
""")

# 3. Middleware
with open("backend/src/middleware/authMiddleware.js", "w") as f:
    f.write("""const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};
""")

# 4. Routes
with open("backend/src/routes/auth.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: 'User already exists' });
        
        user = new User({ name, email, password, role });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
        
        res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
        res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });
        
        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
        
        res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
        res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
""")

with open("backend/src/routes/stations.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const Asset = require('../models/Asset');

router.get('/', async (req, res) => {
    try {
        const stations = await Station.find();
        res.json({ success: true, data: stations });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);
        if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
        res.json({ success: true, data: station });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:stationId/assets', async (req, res) => {
    try {
        const assets = await Asset.find({ stationId: req.params.stationId });
        res.json({ success: true, data: assets });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
""")

with open("backend/src/routes/assets.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const intelligenceService = require('../services/intelligenceService');

router.get('/', async (req, res) => {
    try {
        const assets = await Asset.find().populate('stationId', 'name code');
        res.json({ success: true, data: assets });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id).populate('stationId', 'name code');
        if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
        
        // Mock intelligence data for asset
        const risk = await intelligenceService.getAssetRisk(asset._id.toString());
        const anomaly = await intelligenceService.getAnomalyScore(asset._id.toString());
        const failurePrediction = await intelligenceService.getFailureProbability(asset._id.toString());
        
        const assetData = asset.toJSON();
        assetData.intelligence = { risk, anomaly, failurePrediction, recommendation: "Continue monitoring parameters." };
        
        res.json({ success: true, data: assetData });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
""")

with open("backend/src/routes/telemetry.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');

router.get('/:assetId', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const telemetry = await Telemetry.find({ assetId: req.params.assetId })
            .sort({ timestamp: -1 })
            .limit(limit);
        res.json({ success: true, data: telemetry.reverse() }); // Return chronologically for charts
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:assetId/latest', async (req, res) => {
    try {
        const telemetry = await Telemetry.findOne({ assetId: req.params.assetId }).sort({ timestamp: -1 });
        if (!telemetry) return res.status(404).json({ success: false, message: 'No telemetry found' });
        res.json({ success: true, data: telemetry });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
""")

with open("backend/src/routes/alerts.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.stationId) filter.stationId = req.query.stationId;
        if (req.query.status) filter.status = req.query.status;
        
        const alerts = await Alert.find(filter)
            .populate('assetId', 'name assetId type')
            .populate('stationId', 'name')
            .sort({ timestamp: -1 });
        res.json({ success: true, data: alerts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('assetId', 'name assetId type')
            .populate('stationId', 'name');
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        
        const alert = await Alert.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        
        res.json({ success: true, data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
""")

# 5. Seed script
with open("backend/seed.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
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
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/polaris');
        console.log('Connected to MongoDB');
        
        // Clear existing data
        await User.deleteMany();
        await Station.deleteMany();
        await Asset.deleteMany();
        await Telemetry.deleteMany();
        await Alert.deleteMany();
        console.log('Cleared existing data');
        
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
        
        // 3. Assets for Bharati
        const a1 = await Asset.create({
            stationId: s1._id,
            name: 'Primary Diesel Generator',
            assetId: 'DG-001',
            type: 'Diesel Generator',
            status: 'NORMAL',
            criticality: 'CRITICAL',
            specifications: { capacity: '500kW', brand: 'Cummins' }
        });
        
        const a2 = await Asset.create({
            stationId: s1._id,
            name: 'Main HVAC Unit',
            assetId: 'HVAC-001',
            type: 'HVAC',
            status: 'WARNING',
            criticality: 'HIGH',
            specifications: { capacity: '200 tons' }
        });
        
        const a3 = await Asset.create({
            stationId: s1._id,
            name: 'Main Fuel Tank',
            assetId: 'FUEL-001',
            type: 'Fuel Storage',
            status: 'NORMAL',
            criticality: 'CRITICAL',
            specifications: { capacity: '100000L' }
        });
        
        // Assets for Maitri
        const a4 = await Asset.create({
            stationId: s2._id,
            name: 'Backup Generator',
            assetId: 'DG-002',
            type: 'Backup Generator',
            status: 'NORMAL',
            criticality: 'HIGH'
        });
        
        const a5 = await Asset.create({
            stationId: s2._id,
            name: 'Battery Bank A',
            assetId: 'BAT-001',
            type: 'Battery System',
            status: 'NORMAL',
            criticality: 'HIGH'
        });
        
        // 4. Telemetry for DG-001 (Bharati)
        const now = Date.now();
        const telemetryDocs = [];
        for (let i = 24; i >= 0; i--) {
            // Generate some somewhat realistic variance
            const isAnomaly = i === 2; // Spike 2 hours ago
            telemetryDocs.push({
                assetId: a1._id,
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
            assetId: a1._id,
            type: 'VIBRATION_ANOMALY',
            severity: 'WARNING',
            message: 'DG-001 vibration spiked to 0.45 mm/s',
            status: 'ACTIVE',
            timestamp: new Date(now - 2 * 3600000)
        });
        
        await Alert.create({
            stationId: s1._id,
            assetId: a2._id,
            type: 'MAINTENANCE_REQUIRED',
            severity: 'MEDIUM',
            message: 'HVAC-001 filter replacement due',
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
""")

