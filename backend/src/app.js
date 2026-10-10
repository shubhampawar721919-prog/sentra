const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const path = require('path');
const fs = require('fs');
const connectDB = require('./db');

dotenv.config();

const app = express();
const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : true;

app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB (with fallback & auto-seed when empty)
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/telemetry', require('./routes/telemetry'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/simulation', require('./routes/simulation'));
app.use('/api/decision-center', require('./routes/decisionCenter'));
app.use('/api/sensors', require('./routes/sensors'));

const intelligenceService = require('./services/intelligenceService');
const axios = require('axios');

const handleHealth = async (req, res) => {
    const mlHealth = await intelligenceService.getHealth();
    res.json({
        status: "healthy",
        backend: "healthy",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        ml: mlHealth.status === "UNAVAILABLE" ? "unavailable" : "connected",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
};

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

/**
 * GET /ping & GET /api/ping
 * Returns backend pong, and tests roundtrip latency to ML service and MongoDB for monitoring.
 */
const handlePing = async (req, res) => {
    const start = Date.now();

    // 1. Measure ML Service Ping & Latency
    let mlPing = { status: "offline", latencyMs: null };
    try {
        const mlStart = Date.now();
        const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const mlRes = await axios.get(`${mlUrl}/ping`, { timeout: 2000 });
        mlPing = {
            status: mlRes.data?.status || 'pong',
            latencyMs: Date.now() - mlStart,
            message: mlRes.data?.message || 'ML service responsive'
        };
    } catch (e) {
        mlPing = { status: "offline", error: e.message };
    }

    // 2. Measure Database Ping & Latency
    let dbPing = { status: "disconnected", latencyMs: null };
    try {
        const dbStart = Date.now();
        if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            dbPing = {
                status: "pong",
                latencyMs: Date.now() - dbStart
            };
        }
    } catch (e) {
        dbPing = { status: "error", error: e.message };
    }

    res.status(200).json({
        status: "pong",
        message: "pong",
        service: "sentra-unified",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: Date.now(),
        isoTimestamp: new Date().toISOString(),
        latencyMs: Date.now() - start,
        dependencies: {
            ml: mlPing,
            database: dbPing
        }
    });
};

app.get('/api/ping', handlePing);
app.get('/ping', handlePing);

// Serve built frontend static assets when deployed in unified container
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/ping' || req.path === '/health') {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigin,
        credentials: true
    }
});

// Expose io to routes
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Socket.IO Ping-Pong handler
    socket.on('ping', (clientData) => {
        socket.emit('pong', {
            status: 'pong',
            serverTime: Date.now(),
            clientSentTime: clientData?.timestamp,
            latencyMs: clientData?.timestamp ? (Date.now() - clientData.timestamp) : 0
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
});
