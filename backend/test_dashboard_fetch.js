const axios = require('axios');
const BASE_URL = 'http://localhost:5001/api';

async function testDashboardFetch() {
    try {
        const stationsRes = await axios.get(`${BASE_URL}/stations`);
        const stationId = stationsRes.data.data[0]._id;
        console.log("Testing against Station ID:", stationId);

        console.log("Fetching Assets...");
        const assetsRes = await axios.get(`${BASE_URL}/stations/${stationId}/assets`);
        console.log("Assets:", assetsRes.status);

        console.log("Fetching Alerts...");
        const alertsRes = await axios.get(`${BASE_URL}/alerts?stationId=${stationId}&status=ACTIVE`);
        console.log("Alerts:", alertsRes.status);

        console.log("Fetching Intelligence...");
        const intelRes = await axios.get(`${BASE_URL}/stations/${stationId}/intelligence`);
        console.log("Intelligence:", intelRes.status);

        // Gen telemetry fetch
        const gen = assetsRes.data.data.find(a => a.type?.includes('Generator') || a.assetId?.includes('DG'));
        if (gen) {
            console.log("Fetching Gen Telemetry...", gen._id);
            const telRes = await axios.get(`${BASE_URL}/telemetry/${gen._id}?limit=24`);
            console.log("Telemetry:", telRes.status);
        }
        console.log("All success!");
    } catch (err) {
        if (err.response) {
            console.error("HTTP ERROR:", err.response.status, err.response.data);
        } else {
            console.error("NETWORK ERROR:", err.message);
        }
    }
}
testDashboardFetch();
