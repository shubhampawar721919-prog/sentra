const Alert = require('../models/Alert');

/**
 * Evaluates ML intelligence and creates/updates an alert if necessary.
 * @param {Object} io - Socket.io instance
 * @param {Object} asset - Mongoose Asset document
 * @param {Object} intelligence - The unified intelligence response from ML
 */
async function evaluateAndCreateAlert(io, asset, intelligence) {
    if (!intelligence || intelligence.status === "UNAVAILABLE") return;
    if (!intelligence.decision || !intelligence.risk) return;

    const priority = intelligence.decision.priority;
    const riskLevel = intelligence.risk.level;

    // We only care about HIGH or CRITICAL risks, or priorities ACTION REQUIRED / URGENT
    if (['HIGH', 'CRITICAL'].includes(riskLevel) || ['ACTION REQUIRED', 'URGENT'].includes(priority)) {
        
        const severityMap = {
            'LOW': 'LOW',
            'MEDIUM': 'MEDIUM',
            'HIGH': 'HIGH',
            'CRITICAL': 'CRITICAL',
            'MONITOR': 'LOW',
            'INSPECT': 'MEDIUM',
            'ACTION REQUIRED': 'HIGH',
            'URGENT': 'CRITICAL'
        };

        const alertSeverity = severityMap[riskLevel] || severityMap[priority] || 'HIGH';
        
        // Check for existing open alert for this asset
        let existingAlert = await Alert.findOne({
            assetId: asset._id,
            status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'ACTION_PLANNED'] }
        });

        if (existingAlert) {
            // Check if severity or details changed significantly enough to warrant an update event
            if (existingAlert.severity !== alertSeverity || existingAlert.riskLevel !== riskLevel) {
                existingAlert.severity = alertSeverity;
                existingAlert.riskLevel = riskLevel;
                existingAlert.anomalyScore = intelligence.anomaly?.score || 0;
                existingAlert.failureProbability = intelligence.failurePrediction?.probability || 0;
                existingAlert.decisionPriority = priority;
                existingAlert.message = intelligence.decision.action || 'Risk detected';
                existingAlert.explanation = intelligence.decision.reason?.join(' ') || '';
                existingAlert.affectedAssets = intelligence.cascade?.affectedAssets || [];
                
                await existingAlert.save();
                io.emit('alert:updated', existingAlert);
            }
        } else {
            // Create a new alert
            const newAlert = new Alert({
                stationId: asset.stationId,
                assetId: asset._id,
                assetName: asset.name,
                type: 'Operational',
                severity: alertSeverity,
                riskLevel: riskLevel,
                anomalyScore: intelligence.anomaly?.score || 0,
                failureProbability: intelligence.failurePrediction?.probability || 0,
                decisionPriority: priority,
                message: intelligence.decision.action || 'High risk conditions detected.',
                explanation: intelligence.decision.reason?.join(' ') || '',
                affectedAssets: intelligence.cascade?.affectedAssets || [],
                status: 'ACTIVE'
            });

            await newAlert.save();
            io.emit('alert:created', newAlert);
        }
    } else {
        // If it's normal, we might optionally AUTO-RESOLVE the alert. 
        // But the prompt says "When an asset's risk condition returns to a safe state, do not automatically destroy the alert. Keep historical... transition ACTIVE -> ACKNOWLEDGED -> RESOLVED".
        // Wait, "Allow the alert to transition ACTIVE -> ACKNOWLEDGED -> RESOLVED" implies manual transition, but doesn't strictly forbid auto-resolution if that's standard.
        // Actually, let's keep it manual as requested: "do not automatically destroy the alert." 
        // I won't do anything if it's safe. Operator resolves it manually.
    }
}

module.exports = {
    evaluateAndCreateAlert
};
