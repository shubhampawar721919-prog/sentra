const express = require('express');
const router = express.Router();
router.get('/overview', (req, res) => res.json({ totalAssets: 150, criticalAlerts: 0, overallHealth: 98 }));
module.exports = router;
