const mqtt = require('mqtt');

// Dùng biến global để lưu tạm danh sách các thiết bị vừa quét được
global.discoveredDevices = []; 

const connectMQTT = () => {
    // Kết nối đến Public Broker của HiveMQ
    const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

    client.on('connect', () => {
        console.log('✅ Đã kết nối tới MQTT Broker (HiveMQ)');
        
        // Đăng ký lắng nghe kênh (topic) dành riêng cho việc tìm thiết bị mới
        client.subscribe('tcta/hk3/2026/nhom2/discovery', (err) => {
            if (!err) console.log('🎧 Đang lắng nghe thiết bị ESP32 mới...');
        });
    });

    client.on('message', (topic, message) => {
        if (topic === 'tcta/hk3/2026/nhom2/discovery') {
            try {
                const data = JSON.parse(message.toString());
                
                // Nếu ESP32 gửi lên có chứa MAC Address
                if (data.mac) {
                    // Kiểm tra xem thiết bị này đã được quét trước đó chưa
                    const exists = global.discoveredDevices.find(d => d.mac === data.mac);
                    if (!exists) {
                        global.discoveredDevices.push({
                            device_id: data.mac,
                            name: data.name || 'ESP32 Không tên',
                            discovered_at: new Date()
                        });
                        console.log(`🔍 Phát hiện thiết bị mới: ${data.mac}`);
                    }
                }
            } catch (error) {
                console.error('Lỗi đọc dữ liệu MQTT:', error.message);
            }
        }
    });

    // Tự động dọn dẹp bộ nhớ: Xóa các thiết bị đã quét được sau 5 phút 
    // (tránh việc danh sách quét bị đầy do các thiết bị cũ)
    setInterval(() => {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        global.discoveredDevices = global.discoveredDevices.filter(d => d.discovered_at > fiveMinsAgo);
    }, 60000);
};

module.exports = connectMQTT;