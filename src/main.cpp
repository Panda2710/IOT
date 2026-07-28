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

int sampleTimeinterval = 2000; // Khoảng thời gian lấy mẫu dữ liệu từ cảm biến DHT22 (ms)
int sampleTime = 0;            //  thời gian ĐÃ lấy mẫu dữ liệu từ cảm biến DHT22
int gasThreshold = 2000;       // Ngưỡng cảnh báo khí gas (MQ2)
int alarmThreshold = 10;       // Ngưỡng cảnh báo xâm nhập (cm)
int lightInterval = 500;       // khoảng đèn sáng tắt (ms)
int lightTime = 0;             // thời gian đèn đã sáng
int gasWarning = 0;             // trạng thái cảnh báo khí gas
int alarmWarning = 0;           // trạng thái cảnh báo xâm nhập
int PWM_CHANNEL = 0;


// --- Quãng 3 ---
#define NOTE_C3  131
#define NOTE_D3  147
#define NOTE_E3  165
#define NOTE_F3  175
#define NOTE_G3  196
#define NOTE_A3  220
#define NOTE_B3  247

// --- Quãng 4 ---
#define NOTE_C4  262
#define NOTE_CS4 277  
#define NOTE_D4  294
#define NOTE_DS4 311  
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_FS4 370  
#define NOTE_G4  392
#define NOTE_GS4 415  
#define NOTE_A4  440  
#define NOTE_AS4 466  
#define NOTE_B4  494

// --- Quãng 5  ---
#define NOTE_C5  523
#define NOTE_CS5 554
#define NOTE_D5  587
#define NOTE_DS5 622
#define NOTE_E5  659
#define NOTE_F5  698
#define NOTE_FS5 740
#define NOTE_G5  784
#define NOTE_GS5 831
#define NOTE_A5  880
#define NOTE_AS5 932
#define NOTE_B5  988

// --- Quãng 6 ---
#define NOTE_C6  1047

// int melody[] = {
//   NOTE_G4, NOTE_G4, NOTE_A4, NOTE_G4, NOTE_C5, NOTE_B4,
//   NOTE_G4, NOTE_G4, NOTE_A4, NOTE_G4, NOTE_D5, NOTE_C5,
//   NOTE_G4, NOTE_G4, NOTE_G5, NOTE_E5, NOTE_C5, NOTE_B4, NOTE_A4,
//   NOTE_F5, NOTE_F5, NOTE_E5, NOTE_C5, NOTE_D5, NOTE_C5
// };

// 
// // 250ms = Nốt đen (Đánh nhanh), 500ms = Nốt trắng (Ngân dài), 1000ms = Nốt tròn
// int noteDurations[] = {
//   250, 250, 500, 500, 500, 1000,
//   250, 250, 500, 500, 500, 750,
//   250, 250, 500, 500, 500, 500, 1000,
//   250, 250, 500, 500, 500, 1000
// };
int melody[] = {
  // Câu 1
  NOTE_E5, NOTE_DS5, NOTE_E5, NOTE_DS5, NOTE_E5, NOTE_B4, NOTE_D5, NOTE_C5, NOTE_A4,
  // Câu 2
  NOTE_C4, NOTE_E4, NOTE_A4, NOTE_B4,
  // Câu 3
  NOTE_E4, NOTE_GS4, NOTE_B4, NOTE_C5,
  // Câu 4
  NOTE_E4, NOTE_E5, NOTE_DS5, NOTE_E5, NOTE_DS5, NOTE_E5, NOTE_B4, NOTE_D5, NOTE_C5, NOTE_A4,
  // Câu 5
  NOTE_C4, NOTE_E4, NOTE_A4, NOTE_B4,
  // Câu 6
  NOTE_E4, NOTE_C5, NOTE_B4, NOTE_A4
};

int noteDurations[] = {
  // Câu 1 (9 nốt)
  160, 160, 160, 160, 160, 160, 160, 160, 340,
  // Câu 2 (4 nốt)
  160, 160, 160, 340,
  // Câu 3 (4 nốt)
  160, 160, 160, 340,
  // Câu 4 (10 nốt)
  160, 160, 160, 160, 160, 160, 160, 160, 160, 340,
  // Câu 5 (4 nốt)
  160, 160, 160, 340,
  // Câu 6 (4 nốt)
  160, 160, 160, 700
};
int totalNotes = sizeof(melody) / sizeof(melody[0]);

// --- Đồng hồ & Trạng thái cho Bài hát ---
unsigned long previousMillisSong = 0;
int currentNoteIndex = 0;     // Đang hát đến nốt thứ mấy?
int songState = 0;            // 0: Bắt đầu kêu, 1: Đang kêu, 2: Đang nghỉ khoảng lặng




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
  pinMode(RELAYPIN, OUTPUT);
  // Khởi động cảm biến DHT
  dht.begin();
  // setup wiFi và MQTT
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  ledcSetup(PWM_CHANNEL, 2000, 8);
  ledcAttachPin(BUZZERPIN, PWM_CHANNEL);
  
  // Tắt còi ban đầu (Lưu ý: Truyền vào PWM_CHANNEL chứ không phải BUZZER_PIN)
  ledcWriteTone(PWM_CHANNEL, 0);

}

void loop()
{
  // connect MQTT
  if (!client.connected())
  {
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str()))
    {
      Serial.println("Da ket noi MQTT!");
    }
    else
    {
      Serial.print("Loi MQTT, ma: ");
      Serial.println(client.state());
      delay(3000);
      return;
    }
  }
  client.loop();
  float h;
  float t;

 
  
  if (alarmWarning) {
    int currentDuration = noteDurations[currentNoteIndex];

    // Trạng thái 0: Phát nốt nhạc mới
    if (songState == 0) {
      ledcWriteTone(PWM_CHANNEL, melody[currentNoteIndex]); // Bật còi
      previousMillisSong = millis();                   // Ghi nhớ giờ bắt đầu nốt
      songState = 1;                                        // Chuyển sang chờ nốt kêu
    }
    // Trạng thái 1: Đang kêu -> Chờ đủ thời gian của nốt
    else if (songState == 1) {
      if (millis() - previousMillisSong >= currentDuration) {
        ledcWriteTone(PWM_CHANNEL, 0);                      // Tắt còi tạo khoảng lặng
        previousMillisSong = millis();                 // Ghi nhớ giờ bắt đầu nghỉ
        songState = 2;                                      // Chuyển sang chờ nghỉ
      }
    }
    // Trạng thái 2: Khoảng lặng -> Chờ nghỉ đủ 0.1x thời gian nốt
    else if (songState == 2) {
      if (millis() - previousMillisSong >= (currentDuration * 0.1)) {
        currentNoteIndex++;                                 // Chuyển sang nốt tiếp theo!
        
        // Nếu đã hát hết bài
        if (currentNoteIndex >= totalNotes) {
          currentNoteIndex = 0;                             // Lặp lại từ đầu bài hát
          // Nếu bạn chỉ muốn phát 1 lần rồi thôi thì mở comment dòng dưới:
           alarmWarning = false; 
        }
        songState = 0;                                      // Quay lại Trạng thái 0 cho nốt mới
      }
    }
  }
  else{
    // Nếu không có cảnh báo, tắt còi và reset bài hát
    ledcWriteTone(PWM_CHANNEL, 0);
    currentNoteIndex = 0;
    songState = 0;
  }

  



  if(gasWarning){
      if (millis() - lightTime > lightInterval)
        {
          lightTime = millis();
          digitalWrite(LEDPIN, !digitalRead(LEDPIN));
        }
    }


   // Lấy dữ liệu từ các cảm biến
  if (millis() - sampleTime > sampleTimeinterval)
  {
    sampleTime = millis();
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
    if(t>50){
      digitalWrite(RELAYPIN, HIGH);
    }
    else{
      digitalWrite(RELAYPIN, LOW);
    }
    
    Serial.print(F("Độ ẩm: "));
    Serial.print(h);
    Serial.print(F("%  |  Nhiệt độ: "));
    Serial.print(t);
    Serial.println(F("°C "));

    char payload[200]; // Tạo một mảng trống chứa tối đa 200 ký tự
    // String mac = WiFi.macAddress();
    String mac = "11:22:33:44:55:66";

    // Ghép dữ liệu chuẩn xác vào mảng bằng snprintf (Định dạng JSON)
    snprintf(payload, sizeof(payload), "{\"mac\": \"%s\", \"temp\": %.2f, \"hum\": %.2f, \"gas\": %d,\"trespass\": %d}", mac.c_str(), t, h, gasWarning, alarmWarning);

    // Gửi  lên HiveMQ

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