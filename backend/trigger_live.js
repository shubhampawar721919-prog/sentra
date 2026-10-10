const axios = require('axios');

async function trigger() {
    try {
        console.log('Sending massive anomaly to DG-001 via API...');
        
        const res = await axios.post('http://localhost:5001/api/simulation/trigger-anomaly', {
            assetId: 'DG-001'
        });

        console.log('\n--- ML RESPONSE ---');
        console.log('Risk Level:', res.data.intelligence.risk?.level);
        console.log('Cascade Impact:', res.data.intelligence.cascade?.cascadeRisks?.map(r => `${r.assetId} (${r.level})`).join(', '));
        console.log('-------------------\n');

        console.log('✅ Real-time alert broadcasted via Socket.IO!');
        console.log('Check your dashboard now. It should update without refreshing.');
    } catch (err) {
        console.error('Failed to trigger anomaly:', err.message);
        if (err.response) {
            console.error(err.response.data);
        }
    }
}

trigger();
