const express = require('express');
const router = express.Router();

//Device listing
router.get('/', (req, res) =>  {
    res.status(201).json({
        message: 'Successfully retrieving device data',
        devices: [
            { device_id: 'ESP_001', name: 'PC Gaming', status: true }
        ]
    });
});

//Adding device
router.post('/', (req, res) => {
    res.status(201).json({
        message: 'Successfully adding new device',
        new_device: req.body
    });
});

module.exports = router;