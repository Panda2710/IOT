const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const deviceController = require('../controllers/deviceController');

//Scan thiết bị mới
router.get('/scan', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Danh sách thiết bị quét được',
        devices: global.discoveredDevices || []
    });
});
// Mọi route trong file này đều phải đi qua chốt chặn verifyToken
router.get('/', verifyToken, deviceController.getDevices);
router.post('/', verifyToken, deviceController.addDevice);

module.exports = router;