const db = require('../config/db');

// [GET] Lấy dữ liệu cảm biến để vẽ Chart
const getDeviceMetrics = async (req, res) => {
    const { deviceId } = req.params;

    try {
        // Lấy 20 dòng dữ liệu MỚI NHẤT của thiết bị này
        const result = await db.query(
            `SELECT temperature, humidity, recorded_at 
             FROM metrics 
             WHERE device_id = $1 
             ORDER BY recorded_at DESC 
             LIMIT 20`,
            [deviceId]
        );

        // Dùng hàm .reverse() để đảo lại chiều thời gian từ cũ đến mới.
        const chartData = result.rows.reverse();

        res.status(200).json({ 
            message: `Lấy dữ liệu biểu đồ cho thiết bị ${deviceId} thành công`,
            metrics: chartData 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// [GET] Lấy lịch sử cảnh báo (Alerts)
const getDeviceAlerts = async (req, res) => {
    const { deviceId } = req.params;

    try {
        // Lấy 50 cảnh báo gần nhất
        const result = await db.query(
            `SELECT alert_type, message, triggered_at 
             FROM alert_logs 
             WHERE device_id = $1 
             ORDER BY triggered_at DESC 
             LIMIT 50`,
            [deviceId]
        );

        res.status(200).json({ 
            message: `Lấy lịch sử cảnh báo cho thiết bị ${deviceId} thành công`,
            alerts: result.rows 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

module.exports = { getDeviceMetrics, getDeviceAlerts };