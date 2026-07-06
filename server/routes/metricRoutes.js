const express = require('express');
const metricController = require('../controllers/metricController')
const verifyToken = require('../middlewares/authMiddleware');
const router = express.Router();

// [GET] /api/metrics/:deviceId
router.get('/:deviceId', verifyToken, metricController.getDeviceMetrics);

// [GET] /api/metrics/:deviceId/alerts
router.get('/:deviceId/alerts', verifyToken, metricController.getDeviceAlerts);

module.exports = router;