#include "DHT.h"
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// Cấu hình WiFi ảo của Wokwi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Cấu hình HiveMQ
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

//  Nối dây các cảm biến
#define DHTPIN 4    
#define DHTTYPE DHT22   
#define LDRPIN  34


DHT dht(DHTPIN, DHTTYPE);


void setup_wifi() {
  Serial.print("dang ket noi WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("da ket noi WiFi!");
}

void reconnect() {
  // Lặp lại cho đến khi kết nối MQTT thành công
  while (!client.connected()) {
    Serial.print("dang ket noi MQTT toi HiveMQ...");

    // Tạo một Client ID ngẫu nhiên cho ESP32
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Thử kết nối 
    if (client.connect(clientId.c_str())) {
      Serial.println(" Thanh cong!");
    } else {
      Serial.print(" That bai,  lỗi=");
      Serial.print(client.state());
      Serial.println(" Thu lai sau 5 s...");
      delay(5000);
    }
  }
}





void setup() {
  
  Serial.begin(115200);
  Serial.println(F("Bắt đầu "));
  pinMode(LDRPIN, INPUT);
  // Khởi động cảm biến DHT
  dht.begin();
  //setup wiFi và MQTT
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  // Đợi khoảng 5 giây 
  delay(5000);
  if (!client.connected()) {
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("Da ket noi MQTT!");
    } else {
      Serial.print("Loi MQTT, ma: ");
      Serial.println(client.state());
      delay(3000);
      return;
    }
  }
  client.loop();
  int analogValue = analogRead(LDRPIN);

  float h = dht.readHumidity();

  float t = dht.readTemperature();
  

 
  if (isnan(h) || isnan(t)) {
    Serial.println(F("Loi k doc dc"));
    return;
  }

  
  Serial.print("Gia tri Analog (0-4095): ");
  Serial.print(analogValue);
  Serial.print(" | ");

 
  Serial.print(F("Độ ẩm: "));
  Serial.print(h);
  Serial.print(F("%  |  Nhiệt độ: "));
  Serial.print(t);
  Serial.println(F("°C "));
  
  
  char payload[200]; // Tạo một mảng trống chứa tối đa 200 ký tự
  //String mac = WiFi.macAddress();
  String mac = "11:22:33:44:55:66";
    
    // Ghép dữ liệu chuẩn xác vào mảng bằng snprintf (Định dạng JSON)
  snprintf(payload, sizeof(payload), "{\"mac\": \"%s\", \"temp\": %.2f, \"hum\": %.2f}", mac.c_str(), t, h);

  // Gửi  lên HiveMQ
  
  if (client.publish("tcta/hk3/2026/nhom2/data", payload)) {
        Serial.print("=> GUI THANH CONG: ");
        Serial.println(payload);
    } else {
        Serial.println("=> LOI: GUI THAT BAI!");
    }
}