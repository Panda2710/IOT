#include "DHT.h"
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// Cấu hình WiFi ảo của Wokwi
const char *ssid = "Wokwi-GUEST";
const char *password = "";

// Cấu hình HiveMQ
const char *mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

//  Nối dây các cảm biến
#define DHTPIN 4
#define DHTTYPE DHT22
#define TRIG 13
#define ECHO 14
#define LEDPIN 16
#define BUZZERPIN 17
#define RELAYPIN 23
#define MQ2PIN 34

DHT dht(DHTPIN, DHTTYPE);

long sampleTimeinterval = 10000; // Khoảng thời gian lấy mẫu dữ liệu từ cảm biến DHT22 (ms)
long sampleTime = 0;            //  thời gian ĐÃ lấy mẫu dữ liệu từ cảm biến DHT22 va gửi lên HiveMQ (ms)
long gasThreshold = 2000;       // Ngưỡng cảnh báo khí gas (MQ2)
long alarmThreshold = 10;       // Ngưỡng cảnh báo xâm nhập (cm)
long lightInterval = 500;       // khoảng đèn sáng tắt (ms)
long lightTime = 0;             // thời gian đèn đã sáng
int gasWarning = 0;             // trạng thái cảnh báo khí gas
int alarmWarning = 0;           // trạng thái cảnh báo xâm nhập
long delayTime = 0;              //delay giữa các lần gửi   
int PWM = 0;




void setup_wifi()
{
  Serial.print("dang ket noi WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("da ket noi WiFi!");
}

void reconnect()
{
  // Lặp lại cho đến khi kết nối MQTT thành công
  while (!client.connected())
  {
    Serial.print("dang ket noi MQTT toi HiveMQ...");

    // Tạo một Client ID ngẫu nhiên cho ESP32
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    // Thử kết nối
    if (client.connect(clientId.c_str()))
    {
      Serial.println(" Thanh cong!");

      // ================================================================
      //  PUBLISH LÊN TOPIC DISCOVERY NGAY KHI KẾT NỐI THÀNH CÔNG!
      // ================================================================
      String mac = "11:22:33:44:55:66"; // Hoặc dùng WiFi.macAddress();
      char discoveryPayload[150];

      // Tạo JSON đúng định dạng mà mqtt.js đang mong đợi: { "mac": "...", "name": "..." }
      snprintf(discoveryPayload, sizeof(discoveryPayload),
               "{\"mac\": \"%s\", \"name\": \"Smart PC Case Nhóm 21\"}", mac.c_str());

      // Gửi lên topic discovery 1 lần duy nhất lúc vừa kết nối
      client.publish("tcta/hk3/2026/nhom2/discovery", discoveryPayload);
      Serial.println("=> Da gui thong tin Discovery cho Backend!");
      // ================================================================
      client.subscribe("tcta/hk3/2026/nhom2/fan");
      client.subscribe("tcta/hk3/2026/nhom2/buzzer");
    }
    else
    {
      Serial.print(" That bai,  lỗi=");
      Serial.print(client.state());
      Serial.println(" Thu lai sau 5 s...");
      delay(5000);
    }
  }
}

void callback(char *topic, byte *payload, unsigned int length)
{
  String message = "";
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  Serial.printf("Nhận lệnh từ topic %s: %s\n", topic, message.c_str());

  // Xử lý điều khiển Quạt
  if (String(topic) == "tcta/hk3/2026/nhom2/fan")
  {
    if (message == "ON")
    {
      digitalWrite(RELAYPIN, HIGH);
    }
    else if (message == "OFF")
    {
      digitalWrite(RELAYPIN, LOW);
    }
  }
  // Xử lý điều khiển Còi bằng hàm tone()
  else if (String(topic) == "tcta/hk3/2026/nhom2/buzzer")
  {
    if (message == "ON")
    {
      ledcWriteTone(PWM, 262);
      Serial.println("Buzzer ON");
    }
    else if (message == "OFF")
    {
      ledcWriteTone(PWM, 0);
      Serial.println("Buzzer OFF");
    }
  }
}

int getDistance()
{
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  int duration = pulseIn(ECHO, HIGH);
  int distanceCm = duration * 0.034 / 2;
  return distanceCm;
}

void setup()
{

  Serial.begin(115200);
  Serial.println(F("Bắt đầu "));
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(LEDPIN, OUTPUT);
  pinMode(BUZZERPIN, OUTPUT);
  ledcSetup(PWM, 262, 8);    // Cấu hình kênh PWM 0 với tần số 262Hz và độ phân giải 8 bit
  ledcAttachPin(BUZZERPIN, PWM); // Gán chân BUZZERPIN vào kênh PWM 0
  pinMode(RELAYPIN, OUTPUT);
  // Khởi động cảm biến DHT
  dht.begin();
  // setup wiFi và MQTT
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  // mqttClient.setKeepAlive(60); //
}

void loop()
{
  // connect MQTT
  if (!client.connected())
  {
    reconnect();
  }

  client.loop();
  float h;
  float t;

  // if (alarmWarning)
  // {
  //   debug 
  // }
  // else
  // {
  // }

  if (gasWarning)
  {
    if (millis() - lightTime > lightInterval)
    {
      lightTime = millis();
      digitalWrite(LEDPIN, !digitalRead(LEDPIN));
    }
  }

  // Lấy dữ liệu từ các cảm biến
  if (millis() - delayTime > 2000)
  {
    delayTime = millis();
    h = dht.readHumidity();
    t = dht.readTemperature();
    if (isnan(h) || isnan(t))
    {
      Serial.println(F("Loi k doc dc"));
      return;
    }

    int distance = getDistance();
    if (distance > alarmThreshold)
    {
      Serial.printf("bao dong co nguoi xam nhap (khoanh cach >%d cm): ", alarmThreshold);
      Serial.print(distance);
      Serial.printf(" cm | ");
      alarmWarning = 1;
    }
    else
    {
      alarmWarning = 0;
    }

    int gasValue = analogRead(MQ2PIN);
    if (gasValue > gasThreshold)
    {
      Serial.printf("bao dong co khoi (MQ2 > %d): ", gasThreshold);
      Serial.print(gasValue);
      Serial.printf(" | ");
      gasWarning = 1;
    }
    else
    {
      gasWarning = 0;
    }

    // testing relay
    // if (t > 50)
    // {
    //   digitalWrite(RELAYPIN, HIGH);
    // }
    // else
    // {
    //   digitalWrite(RELAYPIN, LOW);
    // }

    Serial.print(F("Độ ẩm: "));
    Serial.print(h);
    Serial.print(F("%  |  Nhiệt độ: "));
    Serial.print(t);
    Serial.println(F("°C "));
  }

if (millis() - sampleTime > sampleTimeinterval)
  {
    sampleTime = millis();
    char payload[200]; // Tạo một mảng trống chứa tối đa 200 ký tự
    // String mac = WiFi.macAddress();
    String mac = "11:22:33:44:55:67";

    // Ghép dữ liệu chuẩn xác vào mảng bằng snprintf (Định dạng JSON)
    snprintf(payload, sizeof(payload), "{\"mac\": \"%s\", \"temp\": %.2f, \"hum\": %.2f}", mac.c_str(), t, h);

    // Gửi  lên HiveMQ
    char  payload1[100];
    if(alarmWarning)
    {
      snprintf(payload1, sizeof(payload1), "{\"mac\": \"%s\", \"type\": \"tresspass\", \"msg\": \"Phát hiện xâm nhập!\"}", mac.c_str());

      if(client.publish("tcta/hk3/2026/nhom2/alerts", payload1))
      {
        Serial.print("=> GUI THANH CONG: ");
        Serial.println(payload1);
        alarmWarning=0;
      }
      else
      {
        Serial.println("=> LOI: GUI THAT BAI!");
      }
    }


    if (client.publish("tcta/hk3/2026/nhom2/data", payload))
    {
      Serial.print("=> GUI THANH CONG: ");
      Serial.println(payload);
    }
    else
    {
      Serial.println("=> LOI: GUI THAT BAI!");
    }
  }

}