#include "DHT.h"
#include <Arduino.h>


#define DHTPIN 4    


#define DHTTYPE DHT22   
#define LDRPIN  34


DHT dht(DHTPIN, DHTTYPE);

void setup() {
  
  Serial.begin(115200);
  Serial.println(F("Bắt đầu "));
  pinMode(LDRPIN, INPUT);
  // Khởi động cảm biến DHT
  dht.begin();
}

void loop() {
  // Đợi khoảng 2 giây 
  delay(2000);
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

}