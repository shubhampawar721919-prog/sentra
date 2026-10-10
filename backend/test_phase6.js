const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
    console.log("Starting Phase 6 End-to-End Tests");
    
    // Attempt to authenticate
    let token;
    try {
        const authRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'operator',
            password: 'password123'
        });
        token = authRes.data.token;
        console.log("✓ Login successful");
    } catch (e) {
        console.error("Login failed, proceeding anyway if routes are unprotected...");
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
        // 1. Get Stations
        const stationsRes = await axios.get(`${BASE_URL}/stations`, { headers });
        const station = stationsRes.data.data[0];
        console.log(`✓ Fetched Station: ${station.name}`);

        // 2. Get Station Intelligence
        const intelRes = await axios.get(`${BASE_URL}/stations/${station._id}/intelligence`, { headers });
        console.log(`✓ Fetched Station Intelligence. Status:`, intelRes.data.data.status || 'AVAILABLE');
        if (intelRes.data.data.stationRisk) {
            console.log(`  - Station Risk Level: ${intelRes.data.data.stationRisk.level}`);
            console.log(`  - Station Primary Risk: ${intelRes.data.data.primaryRiskAsset}`);
            console.log(`  - Decision Priority: ${intelRes.data.data.decision.priority}`);
        }

        // 3. Get specific asset
        const assetsRes = await axios.get(`${BASE_URL}/stations/${station._id}/assets`, { headers });
        const dg = assetsRes.data.data.find(a => a.assetId === 'DG-001');
        
        const assetRes = await axios.get(`${BASE_URL}/assets/${dg._id}`, { headers });
        console.log(`✓ Fetched Asset Detail: ${assetRes.data.data.name}`);
        const intel = assetRes.data.data.intelligence;
        
        if (intel && intel.status !== 'UNAVAILABLE') {
            console.log(`  - Risk: ${intel.risk.level}`);
            console.log(`  - Anomaly Score: ${intel.anomaly.score}`);
            console.log(`  - Failure Probability: ${intel.failurePrediction.probability}`);
            console.log(`  - Decision Priority: ${intel.decision.priority}`);
            console.log(`  - AI Analysis: ${intel.analysis}`);
        }

        // 4. Test What-If Simulation via Node
        const simRes = await axios.post(`${BASE_URL}/simulation`, {
            assetId: 'DG-001',
            changes: {
                vibration: 1.5,
                temperature: 120
            }
        }, { headers });
        console.log(`✓ Ran What-If Simulation via Node.`);
        
        const simData = simRes.data.data;
        if (simData.baseline && simData.simulation) {
            console.log(`  - Baseline Risk: ${simData.baseline.riskLevel}`);
            console.log(`  - Simulated Risk: ${simData.simulation.riskLevel}`);
            console.log(`  - Risk Increase: ${simData.change.riskIncrease}`);
        } else {
            console.log(`  - Simulation Response:`, JSON.stringify(simData, null, 2));
        }
    } catch (e) {
        console.error("Test failed:", e.response ? e.response.data : e.message);
    }
}

runTests();
