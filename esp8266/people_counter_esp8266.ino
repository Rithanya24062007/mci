/*
 * QueuePro — ESP8266 People Counter (IR modules)
 *
 * Wiring (IR modules):
 * ┌──────────────┬────────────┐
 * │ IR Signal    │ ESP GPIO   │
 * ├──────────────┼────────────┤
 * │ ENTRY OUT    │ GPIO 5     │
 * │ EXIT OUT     │ GPIO 4     │
 * │ VCC          │ 3.3V - 5V   │
 * │ GND          │ GND        │
 * └──────────────┴────────────┘
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// ── CONFIG — CHANGE THESE ────────────────────────────────────
const char* WIFI_SSID      = ""; // set your SSID
const char* WIFI_PASSWORD  = ""; // set your password

const char* SERVER_HOST    = "http://10.229.158.168:3000"; // backend host
const char* DEVICE_API_KEY = "ESP32_SECRET_KEY_2026_CHANGE_IN_PRODUCTION"; // keep if backend expects this
const char* DEVICE_ID      = "ESP8266_001";

// IR sensor configuration
// IR modules commonly output LOW when an object is detected (active-low).
const int IR_ACTIVE_STATE = LOW; // set to HIGH if your IR sensor is active-high

// Cooldown between detections on same sensor (ms)
const unsigned long COOLDOWN_MS = 2000;

// PIN DEFINITIONS
#define ENTRY_PIN   5   // GPIO5
#define EXIT_PIN    4   // GPIO4 (change if you prefer another free pin)

unsigned long lastEntryTime = 0;
unsigned long lastExitTime  = 0;

bool isDetected(int pin) {
  int v = digitalRead(pin);
  return (v == IR_ACTIVE_STATE);
}

void sendEvent(const char* sensorType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Not connected — skipping event send");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_HOST) + "/device/event";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);

  StaticJsonDocument<128> doc;
  doc["device_id"] = DEVICE_ID;
  doc["sensor"] = sensorType;
  String body;
  serializeJson(doc, body);

  Serial.printf("[HTTP] POST %s  body=%s\n", url.c_str(), body.c_str());
  int httpCode = http.POST(body);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Response %d: %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("[HTTP] Error: %d\n", httpCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(ENTRY_PIN, INPUT_PULLUP);
  pinMode(EXIT_PIN, INPUT_PULLUP);

  Serial.printf("\n[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("[Device] ID: %s  Server: %s\n\n", DEVICE_ID, SERVER_HOST);
}

void loop() {
  unsigned long now = millis();

  if (isDetected(ENTRY_PIN)) {
    if (now - lastEntryTime > COOLDOWN_MS) {
      lastEntryTime = now;
      Serial.println("[ENTRY] IR sensor triggered");
      sendEvent("entry");
    }
  }

  delay(60);

  if (isDetected(EXIT_PIN)) {
    if (now - lastExitTime > COOLDOWN_MS) {
      lastExitTime = now;
      Serial.println("[EXIT] IR sensor triggered");
      sendEvent("exit");
    }
  }

  delay(60);
}
