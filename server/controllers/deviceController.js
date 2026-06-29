const db = require('../config/db');

const getDevices = async (req, res) => {
    const userId = req.user.user_id;
    try {
        const result = await db.query(
            'SELECT device_id, device_name, status, created_at FROM devices WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.status(200).json({
            message: 'Successfully retrieve device list',
            devices: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

const addDevice = async (req, res) => {
    const { device_id, device_name } = req.body || {};
    const userId = req.user.user_id;

    if (!device_id || !device_name) {
        return res.status(400).json({ error: 'Please provide device ID or device name' });
    }

    try {
        const result = await db.query(
            'INSERT INTO devices(device_id, user_id, device_name) VALUES($1, $2, $3) RETURNING *',
            [device_id, userId, device_name]
        );

        res.status(201).json({
            message: 'Thêm thiết bị mới thành công',
            device: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Mã thiết bị này đã tồn tại trên hệ thống' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getDevices, addDevice };