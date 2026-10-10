import os
import json

# =========================================================================
# ROOT FILES
# =========================================================================

root_package = {
  "name": "polaris-monorepo",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\" \"npm run dev:ml\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "dev:ml": "cd ml && uvicorn app.main:app --reload --port 8000"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}

with open("package.json", "w") as f:
    json.dump(root_package, f, indent=2)

with open("README.md", "w") as f:
    f.write("# POLARIS\n\nDigital Twin Platform for Indian Antarctic Research Stations.\n")

with open(".gitignore", "w") as f:
    f.write("node_modules/\n.env\n__pycache__/\nvenv/\n*.pyc\n")

with open(".env.example", "w") as f:
    f.write("# Root level env if needed\n")

# =========================================================================
# ML LAYER
# =========================================================================

ml_requirements = """fastapi
uvicorn
pandas
numpy
scikit-learn
xgboost
python-dotenv
requests
groq
"""
with open("ml/requirements.txt", "w") as f:
    f.write(ml_requirements)

with open("ml/.env.example", "w") as f:
    f.write("GROQ_API_KEY=your_groq_api_key_here\nGROQ_MODEL=mixtral-8x7b-32768\n")
with open("ml/.env", "w") as f:
    f.write("GROQ_API_KEY=\nGROQ_MODEL=mixtral-8x7b-32768\n")

os.makedirs("ml/app/models", exist_ok=True)
os.makedirs("ml/app/services", exist_ok=True)
os.makedirs("ml/app/routes", exist_ok=True)
os.makedirs("ml/app/utils", exist_ok=True)

with open("ml/app/main.py", "w") as f:
    f.write("""from fastapi import FastAPI
from app.routes import api

app = FastAPI(title="POLARIS ML API")

app.include_router(api.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "POLARIS ML Layer"}
""")

with open("ml/app/routes/api.py", "w") as f:
    f.write("""from fastapi import APIRouter
from pydantic import BaseModel
from app.services.groq_service import analyze_station_data

router = APIRouter()

class TelemetryData(BaseModel):
    assetId: str
    temperature: float = None
    vibration: float = None

@router.post("/anomaly-detection")
def detect_anomaly(data: TelemetryData):
    return {
        "assetId": data.assetId,
        "anomalyScore": 0.18,
        "riskLevel": "LOW",
        "confidence": 0.91
    }

@router.post("/failure-prediction")
def predict_failure(data: TelemetryData):
    return {
        "assetId": data.assetId,
        "failureProbability": 0.05
    }

@router.post("/forecast")
def forecast(data: TelemetryData):
    return {
        "assetId": data.assetId,
        "forecast": [22.1, 22.3, 22.5]
    }

@router.post("/risk-analysis")
def risk_analysis(data: TelemetryData):
    return {
        "assetId": data.assetId,
        "riskScore": 0.12,
        "level": "LOW"
    }

@router.post("/ai-analysis")
def ai_analysis(data: TelemetryData):
    result = analyze_station_data(data.dict())
    return {"analysis": result}
""")

with open("ml/app/services/groq_service.py", "w") as f:
    f.write("""import os
from dotenv import load_dotenv

load_dotenv()

def analyze_station_data(telemetry_data):
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
    
    if not api_key:
        return "GROQ_API_KEY not configured. This is a mock AI response. The asset appears to be functioning normally."
    
    # In a real implementation, we would use the groq client here
    # client = Groq(api_key=api_key)
    # chat_completion = client.chat.completions.create(...)
    
    return f"Simulated Groq Analysis for {telemetry_data.get('assetId')}: All systems nominal. Monitored parameters are within expected ranges."
""")

with open("ml/app/services/anomaly_service.py", "w") as f:
    f.write("def get_anomaly_score(data):\n    return 0.1\n")
with open("ml/app/services/failure_prediction_service.py", "w") as f:
    f.write("def get_failure_prediction(data):\n    return 0.05\n")
with open("ml/app/services/forecasting_service.py", "w") as f:
    f.write("def get_forecast(data):\n    return []\n")
with open("ml/app/services/risk_service.py", "w") as f:
    f.write("def get_risk_score(data):\n    return 0.1\n")


# =========================================================================
# BACKEND LAYER
# =========================================================================

backend_package = {
  "name": "backend",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "axios": "^1.6.8",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.3.4"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
with open("backend/package.json", "w") as f:
    json.dump(backend_package, f, indent=2)

with open("backend/.env.example", "w") as f:
    f.write("PORT=5000\nMONGO_URI=mongodb://localhost:27017/polaris\nJWT_SECRET=supersecret\nML_SERVICE_URL=http://localhost:8000\n")
with open("backend/.env", "w") as f:
    f.write("PORT=5000\nMONGO_URI=mongodb://localhost:27017/polaris\nJWT_SECRET=supersecret\nML_SERVICE_URL=http://localhost:8000\n")

os.makedirs("backend/src/controllers", exist_ok=True)
os.makedirs("backend/src/routes", exist_ok=True)
os.makedirs("backend/src/models", exist_ok=True)
os.makedirs("backend/src/middleware", exist_ok=True)
os.makedirs("backend/src/services", exist_ok=True)
os.makedirs("backend/src/utils", exist_ok=True)

with open("backend/src/app.js", "w") as f:
    f.write("""const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/telemetry', require('./routes/telemetry'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/simulation', require('./routes/simulation'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
""")

with open("backend/src/routes/auth.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
router.post('/login', (req, res) => res.json({ token: 'mock-jwt-token' }));
module.exports = router;
""")

with open("backend/src/routes/stations.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.json([{ id: 'ST-01', name: 'Bharati', status: 'ONLINE' }]));
router.get('/:id', (req, res) => res.json({ id: req.params.id, name: 'Bharati', status: 'ONLINE' }));
module.exports = router;
""")

with open("backend/src/routes/assets.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
const intelligenceService = require('../services/intelligenceService');

router.get('/', (req, res) => res.json([{ id: 'DG-001', name: 'Diesel Generator 1', status: 'NORMAL' }]));
router.get('/:id', async (req, res) => {
    const assetId = req.params.id;
    // Get mock intelligence data for asset
    const risk = await intelligenceService.getAssetRisk(assetId);
    const anomaly = await intelligenceService.getAnomalyScore(assetId);
    const failurePrediction = await intelligenceService.getFailureProbability(assetId);
    
    res.json({
        id: assetId,
        name: 'Diesel Generator 1',
        type: 'POWER',
        status: 'NORMAL',
        risk,
        anomaly,
        failurePrediction,
        recommendation: "Continue monitoring generator vibration."
    });
});
module.exports = router;
""")

with open("backend/src/routes/telemetry.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
router.get('/:assetId', (req, res) => res.json([
    { timestamp: Date.now() - 3600000, temperature: 45, vibration: 0.2 },
    { timestamp: Date.now(), temperature: 46, vibration: 0.22 }
]));
module.exports = router;
""")

with open("backend/src/routes/alerts.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.json([
    { id: 1, assetId: 'DG-001', message: 'Vibration slightly above normal', severity: 'WARNING', timestamp: Date.now() }
]));
module.exports = router;
""")

with open("backend/src/routes/analytics.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
router.get('/overview', (req, res) => res.json({ totalAssets: 150, criticalAlerts: 0, overallHealth: 98 }));
module.exports = router;
""")

with open("backend/src/routes/simulation.js", "w") as f:
    f.write("""const express = require('express');
const router = express.Router();
router.post('/start', (req, res) => res.json({ message: 'Simulation started' }));
module.exports = router;
""")

with open("backend/src/services/intelligenceService.js", "w") as f:
    f.write("""// Future: these will call the Python ML Layer via Axios
const axios = require('axios');

async function getAssetRisk(assetId) {
    // Mock response for now
    return {
        level: "MEDIUM",
        score: 0.62
    };
}

async function getAnomalyScore(assetId) {
    return {
        score: 0.41,
        detected: false
    };
}

async function getFailureProbability(assetId) {
    return {
        probability: 0.27
    };
}

async function getForecast(assetId) {
    return {
        values: []
    };
}

module.exports = {
    getAssetRisk,
    getAnomalyScore,
    getFailureProbability,
    getForecast
};
""")

with open("backend/src/models/Station.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const StationSchema = new mongoose.Schema({
    name: String,
    code: String,
    location: String,
    status: String,
    coordinates: { lat: Number, lng: Number },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Station', StationSchema);
""")

with open("backend/src/models/Asset.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const AssetSchema = new mongoose.Schema({
    stationId: mongoose.Schema.Types.ObjectId,
    name: String,
    type: String,
    status: String,
    criticality: String,
    specifications: Object,
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Asset', AssetSchema);
""")

with open("backend/src/models/Telemetry.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const TelemetrySchema = new mongoose.Schema({
    assetId: mongoose.Schema.Types.ObjectId,
    timestamp: Date,
    temperature: Number,
    pressure: Number,
    vibration: Number,
    power: Number,
    fuelLevel: Number,
    additionalMetrics: Object
});
module.exports = mongoose.model('Telemetry', TelemetrySchema);
""")

with open("backend/src/models/Alert.js", "w") as f:
    f.write("""const mongoose = require('mongoose');
const AlertSchema = new mongoose.Schema({
    stationId: mongoose.Schema.Types.ObjectId,
    assetId: mongoose.Schema.Types.ObjectId,
    type: String,
    severity: String,
    message: String,
    status: String,
    timestamp: Date,
    metadata: Object
});
module.exports = mongoose.model('Alert', AlertSchema);
""")

