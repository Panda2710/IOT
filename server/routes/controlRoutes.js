const express = require('express');
const router = express.Router();
const controlController = require('../controllers/controlController');
const authMiddleware = require('../middlewares/authMiddleware'); 

// Route điều khiển Quạt
router.post('/fan', authMiddleware, controlController.controlFan);

// Route điều khiển Còi hú
router.post('/buzzer', authMiddleware, controlController.controlBuzzer);

module.exports = router;