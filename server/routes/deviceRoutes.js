const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');

//Device listing
router.get('/', verifyToken, (req, res) =>  {
    res.status(201).json({
        message: 'Successfully retrieving device data',
        devices: [
            { device_id: 'ESP_001', name: 'PC Gaming', status: true }
        ]
    });
});

//Adding device
router.post('/', verifyTokenm, (req, res) => {
    res.status(201).json({
        message: 'Successfully adding new device',
        new_device: req.body
    });
});

module.exports = router;