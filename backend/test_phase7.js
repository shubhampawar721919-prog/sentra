const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:5001/api';
const socket = io('http://localhost:5001');

async function runTests() {
    console.log("Phase 7 Integration Tests");

    socket.on('alert:created', (alert) => {
        console.log("🔔 [Socket] alert:created received for", alert.assetName, "- Severity:", alert.severity);
    });

    socket.on('alert:updated', (alert) => {
        console.log("🔄 [Socket] alert:updated received for", alert.assetName, "- Status:", alert.status);
    });

    let token = null;
    let headers = {};
    try {
        const login = await axios.post(`${BASE_URL}/auth/login`, { username: 'operator', password: 'password123' });
        token = login.data.token;
        headers = { Authorization: `Bearer ${token}` };
        console.log("✓ Logged in");
    } catch {
        console.log("Login failed, proceeding anyway if routes are unprotected...");
    }

    try {
        const stationsRes = await axios.get(`${BASE_URL}/stations`, { headers });
        const station = stationsRes.data.data[0];

        const assetsRes = await axios.get(`${BASE_URL}/stations/${station._id}/assets`, { headers });
        const dg = assetsRes.data.data.find(a => a.assetId === 'DG-001');

        console.log("✓ Fetching intelligence to trigger potential alerts...");
        await axios.get(`${BASE_URL}/assets/${dg._id}`, { headers });

        // Wait a sec for socket
        await new Promise(r => setTimeout(r, 1000));

        console.log("✓ Fetching all alerts...");
        const alertsRes = await axios.get(`${BASE_URL}/alerts?stationId=${station._id}`, { headers });
        const alerts = alertsRes.data.data;
        console.log(`Found ${alerts.length} alerts.`);

        if (alerts.length > 0) {
            const latestAlert = alerts[0];
            console.log(`✓ Acknowledging alert ${latestAlert._id}...`);
            await axios.post(`${BASE_URL}/alerts/${latestAlert._id}/acknowledge`, {}, { headers });
            
            await new Promise(r => setTimeout(r, 500));
            
            console.log(`✓ Resolving alert ${latestAlert._id}...`);
            await axios.post(`${BASE_URL}/alerts/${latestAlert._id}/resolve`, {}, { headers });

            await new Promise(r => setTimeout(r, 500));
            
            console.log(`✓ Requesting AI explanation for alert ${latestAlert._id}...`);
            const explainRes = await axios.post(`${BASE_URL}/alerts/${latestAlert._id}/explain`, {}, { headers });
            console.log("AI Explanation:", explainRes.data.data.analysis.substring(0, 50) + "...");
        }

    } catch (err) {
        console.error("Test error:", err.response ? err.response.data : err.message);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

socket.on('connect', () => {
    runTests();
});
