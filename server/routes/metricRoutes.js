const express = require('express');
const router = express.Router();

//Retrieving metric data for one specific device
router.get('/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    res.status(200).json({
        message: `Retrieving metric data for ${deviceId}`,
        metrics: [
            { temp: 45.5, hum: 60.2, time: '2026-06-24T20:00:00Z' },
            { temp: 46.0, hum: 61.0, time: '2026-06-24T20:05:00Z' }
        ]
    });
});

//Retrieving alert log for one specific device
router.get('/:deviceId/alerts', (req, res) => {
    const { deviceId } = req.params;
    res.status(200).json({
        message: `Retrieving alert log for ${deviceId}`,
        alerts: [
            { type: 'INTRUSION', resolved: false, time: '2026-06-24T19:30:00Z' }
        ]
    });
});

module.exports = router;