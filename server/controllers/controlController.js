// Gọi hàm sendControlCommand từ file cấu hình MQTT
const { sendControlCommand } = require('../config/mqtt');

// [POST] /api/control/fan
exports.controlFan = (req, res) => {
    try {
        // Nhận mac address và action (ON/OFF) từ Frontend gửi lên
        const { mac, action } = req.body;

        if (!mac || !action) {
            return res.status(400).json({ success: false, message: "Thiếu tham số mac hoặc action" });
        }

        if (action !== 'ON' && action !== 'OFF') {
            return res.status(400).json({ success: false, message: "Action không hợp lệ (Chỉ nhận ON/OFF)" });
        }

        // Gọi hàm bắn tín hiệu MQTT xuống ESP32
        const isSent = sendControlCommand(mac, 'FAN', action);

        if (isSent) {
            return res.status(200).json({ success: true, message: `Đã gửi lệnh ${action} cho Quạt thành công.` });
        } else {
            return res.status(500).json({ success: false, message: "MQTT Client chưa sẵn sàng." });
        }

    } catch (error) {
        console.error("Lỗi API controlFan:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// [POST] /api/control/buzzer
exports.controlBuzzer = (req, res) => {
    try {
        const { mac, action } = req.body;

        if (!mac || !action) {
            return res.status(400).json({ success: false, message: "Thiếu tham số mac hoặc action" });
        }

        if (action !== 'ON' && action !== 'OFF') {
            return res.status(400).json({ success: false, message: "Action không hợp lệ (Chỉ nhận ON/OFF)" });
        }

        const isSent = sendControlCommand(mac, 'BUZZER', action);

        if (isSent) {
            return res.status(200).json({ success: true, message: `Đã gửi lệnh ${action} cho Còi hú thành công.` });
        } else {
            return res.status(500).json({ success: false, message: "MQTT Client chưa sẵn sàng." });
        }

    } catch (error) {
        console.error("Lỗi API controlBuzzer:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};