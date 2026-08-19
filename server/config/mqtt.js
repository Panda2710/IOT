const mqtt = require('mqtt');
const db = require('./db');

let mqttClient = null;

// Dùng biến global để lưu tạm danh sách các thiết bị vừa quét được
global.discoveredDevices = []; 

const TOPIC_DISCOVERY = 'tcta/hk3/nhom2/discovery'; // Nghe kênh 1: Tìm thiết bị mới (Discovery)
const TOPIC_METRICS = 'tcta/hk3/nhom2/data'; // Nghe kênh 2: Hứng dữ liệu cảm biến (Data)
const TOPIC_ALERTS = 'tcta/hk3/nhom2/alerts'; // Nghe kênh 3: Dữ liệu cảnh báo khẩn cấp (Alerts)
const TOPIC_CONTROL = 'tcta/hk3/nhom2/control'; // Nghe kênh 4: Gửi tín hiệu điều khiển thiết bị (Control)

const connectMQTT = () => {
    // Kết nối đến Public Broker của HiveMQ
    const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

    mqttClient = client;

    client.on('connect', () => {
        console.log('Đã kết nối tới MQTT Broker (HiveMQ)');
        
        client.subscribe([TOPIC_METRICS, TOPIC_ALERTS], (err) => {
        if (!err) {
            console.log(`Đang lắng nghe trên các kênh: \n - ${TOPIC_DISCOVERY} \n - ${TOPIC_METRICS} \n - ${TOPIC_ALERTS}`);
        } else {
            console.error('Lỗi Subscribe:', err);
        }
    });
    });

    client.on('message', async (topic, message) => {
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
                        console.log(`Phát hiện thiết bị mới: ${data.mac}`);
                    }
                }
            } catch (error) {
                if (error instanceof SyntaxError) return;
                console.error('Lỗi đọc dữ liệu MQTT:', error.message);
            }
        }

        if(topic === 'tcta/hk3/2026/nhom2/alerts') {
            try {
                const alertData = JSON.parse(message.toString());
                if (alertData.mac && alertData.type && alertData.msg) {

                    await db.query(
                        'INSERT INTO alert_logs(device_id, alert_type, message) VALUES($1, $2, $3)',
                        [alertData.mac, alertData.type, alertData.msg]
                    );

                    console.log(`\x1b[41m\x1b[37m [KHẨN CẤP] ${alertData.msg} [Thiết bị: ${alertData.mac}] \x1b[0m`);
                }
            } catch (error) {
                if (error instanceof SyntaxError) return;
                console.log('Lỗi lưu luồng sự kiện khẩn cấp:', error.message);
            }
        }

        if (topic === 'tcta/hk3/2026/nhom2/data') {
            try {
                const data = JSON.parse(message.toString());
                
                // Đảm bảo ESP32 gửi đủ 3 thông số: mac, temp, hum
                if (data.mac && data.temp !== undefined && data.hum !== undefined) {
                    
                    // Thực thi SQL chèn thẳng vào bảng metrics
                    await db.query(
                        'INSERT INTO metrics(device_id, temperature, humidity) VALUES($1, $2, $3)',
                        [data.mac, data.temp, data.hum]
                    );
                    
                    console.log(`Đã lưu DB -> Thiết bị [${data.mac}] | Nhiệt độ: ${data.temp}°C | Độ ẩm: ${data.hum}%`);
                }

                const TEMP_THRESHOLD = 70.0; // Ngưỡng nhiệt độ nguy hiểm: 70 độ C
                const HUM_THRESHOLD = 90.0; // Ngưỡng độ ẩm nguy hiểm: 90%
                const COOLDOWN_MINUTES = 5;
                    if (data.temp >= TEMP_THRESHOLD) {
                        const alertType = 'HIGH_TEMP';

                        const checkAlert = await db.query(
                            `SELECT EXTRACT(EPOCH FROM (NOW() - triggered_at)) / 60 AS diff_minutes
                             FROM alert_logs 
                             WHERE device_id = $1 AND alert_type = $2 
                             ORDER BY triggered_at DESC LIMIT 1`,
                            [data.mac, alertType]
                        );

                        let shouldAlert = true;

                        if (checkAlert.rows.length > 0) {
                            const diffMinutes = checkAlert.rows[0].diff_minutes;

                            // Nếu khoảng cách nhỏ hơn 5 phút -> Bỏ qua không cảnh báo nữa
                            if (diffMinutes < COOLDOWN_MINUTES) {
                                shouldAlert = false;
                                console.log(`Cooldown: Bỏ qua cảnh báo spam cho thiết bị [${data.mac}]`);
                            }
                        }

                        if(shouldAlert) {
                            const alertMsg = `Cảnh báo khẩn! Nhiệt độ đạt mức ${data.temp}°C`;
                            await db.query(
                                'INSERT INTO alert_logs(device_id, alert_type, message) VALUES($1, $2, $3)',
                                [data.mac, alertType, alertMsg]
                            );
                            // In ra terminal
                            console.log(`\x1b[31mBÁO ĐỘNG: ${alertMsg} [Thiết bị: ${data.mac}]\x1b[0m`);
                        }

                    }
                    if (data.hum >= HUM_THRESHOLD) {
                        const alertType = 'HIGH_HUMIDITY';
                        const checkAlert = await db.query(
                            `SELECT EXTRACT(EPOCH FROM (NOW() - triggered_at)) / 60 AS diff_minutes 
                             FROM alert_logs
                             WHERE device_id = $1 AND alert_type = $2 
                             ORDER BY triggered_at DESC LIMIT 1`,
                            [data.mac, alertType]
                        );

                        let shouldAlert = true;

                        if (checkAlert.rows.length > 0) {
                            const diffMinutes = checkAlert.rows[0].diff_minutes;

                            // Nếu khoảng cách nhỏ hơn 5 phút -> Bỏ qua không cảnh báo nữa
                            if (diffMinutes < COOLDOWN_MINUTES) {
                                shouldAlert = false;
                                console.log(`Cooldown: Bỏ qua cảnh báo spam cho thiết bị [${data.mac}]`);
                            }
                        }
                        if(shouldAlert) {
                            const alertMsg = `Cảnh báo khẩn! Độ ẩm đạt mức ${data.hum}%`

                            await db.query(
                                'INSERT INTO alert_logs(device_id, alert_type, message) VALUES($1, $2, $3)',
                                [data.mac, alertType, alertMsg]
                            );
                            console.log(`\x1b[31mBÁO ĐỘNG: ${alertMsg} [Thiết bị: ${data.mac}]\x1b[0m`);
                        }
                    }
            } catch (error) {
                if (error instanceof SyntaxError) return;
                // Bắt lỗi 23503 (Khóa ngoại): Nếu ESP32 gửi data nhưng cái MAC này chưa được thêm vào bảng Devices
                if (error.code === '23503') {
                    console.log(`Cảnh báo: Thiết bị [${JSON.parse(message.toString()).mac}] đang gửi dữ liệu nhưng chưa được đăng ký trong hệ thống!`);
                } else {
                    console.error('Lỗi lưu dữ liệu Metrics:', error.message);
                }
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

const sendControlCommand = (mac, device, action) => {
    if (mqttClient) {
        // Cấu trúc Topic động: tcta/hk3/2026/nhom2/{MAC_ADDRESS}/{DEVICE}
        let topic = '';
        if (device === 'FAN') {
            topic = `tcta/hk3/2026/nhom2/fan`;
        } else if (device === 'BUZZER') {
            topic = `tcta/hk3/2026/nhom2/buzzer`;
        } else {
            return false;
        }

        // Vẫn gửi chuỗi thô để ESP32 dễ đọc
        mqttClient.publish(topic, action, (err) => {
            if (err) {
                console.error(`Lỗi gửi lệnh đến ${device}:`, err);
            } else {
                console.log(`\x1b[36m[ĐIỀU KHIỂN] Đã gửi lệnh ${action} vào kênh ${topic}\x1b[0m cho ${device} (MAC: ${mac})\x1b[0m`);
            }
        });
        return true;
    }
    return false;
};

module.exports = { connectMQTT, sendControlCommand };