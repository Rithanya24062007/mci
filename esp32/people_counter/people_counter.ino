/*
 * ============================================================
 *  QueuePro — ESP32 People Counter
 *  Dual IR Reflective Sensors (Entry + Exit)
 *
 *  Entry sensor triggered  → POST /device/event  { sensor: "entry" }  → count +1
 *  Exit  sensor triggered  → POST /device/event  { sensor: "exit"  }  → count -1
 *
 *  Wiring (IR modules):
 *  ┌──────────────┬────────────┐
 *  │ IR Signal    │ ESP32 GPIO │
 *  ├──────────────┼────────────┤
 *  │ ENTRY OUT    │ GPIO 5     │
 *  │ EXIT OUT     │ GPIO 19    │
 *  │ VCC          │ 3.3V - 5V   │
 *  │ GND          │ GND        │
 *  └──────────────┴────────────┘
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>        // Install: Arduino Library Manager → "ArduinoJson" by Benoit Blanchon

// ── CONFIG — CHANGE THESE ────────────────────────────────────
const char* WIFI_SSID      = "Muthuraj";
const char* WIFI_PASSWORD  = "muthu128";

// Your PC's local IP address (run `ipconfig` on Windows to find it)
const char* SERVER_HOST    = "http://10.74.242.168:3000";

// Must match ESP32_API_KEY in backend/.env
const char* DEVICE_API_KEY = "ESP32_SECRET_KEY_2026_CHANGE_IN_PRODUCTION";

// Must match the device_id you mapped in Admin → Device Mapping
const char* DEVICE_ID      = "ESP32_001";

// IR sensor configuration
// IR modules commonly output LOW when an object is detected (active-low).
// If your sensors output HIGH on detection, change to HIGH below.
const int IR_ACTIVE_STATE = LOW; // set to HIGH if your IR sensor is active-high

// Cooldown between detections on same sensor (ms) — prevents double-count
const unsigned long COOLDOWN_MS = 2000;
// ─────────────────────────────────────────────────────────────

// ── PIN DEFINITIONS ──────────────────────────────────────────
#define ENTRY_PIN   5   // IR sensor digital output for entry
#define EXIT_PIN    19  // IR sensor digital output for exit
// ─────────────────────────────────────────────────────────────

unsigned long lastEntryTime = 0;
unsigned long lastExitTime  = 0;
// ─────────────────────────────────────────────────────────────
// IR detection helper — returns true when sensor indicates object
// ─────────────────────────────────────────────────────────────
bool isDetected(int pin) {
    int v = digitalRead(pin);
    return (v == IR_ACTIVE_STATE);
}

// ─────────────────────────────────────────────────────────────
// Send sensor event to backend
// ─────────────────────────────────────────────────────────────
void sendEvent(const char* sensorType) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Not connected — skipping event send");
        return;
    }

    HTTPClient http;
    String url = String(SERVER_HOST) + "/device/event";
    http.begin(url);
    http.addHeader("Content-Type",  "application/json");
    http.addHeader("x-device-key",  DEVICE_API_KEY);

    // Build JSON body
    StaticJsonDocument<128> doc;
    doc["device_id"] = DEVICE_ID;
    doc["sensor"]    = sensorType;
    String body;
    serializeJson(doc, body);

    Serial.printf("[HTTP] POST %s  body=%s\n", url.c_str(), body.c_str());
    int httpCode = http.POST(body);

    if (httpCode > 0) {
        String response = http.getString();
        Serial.printf("[HTTP] Response %d: %s\n", httpCode, response.c_str());
    } else {
        Serial.printf("[HTTP] Error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
}

// ─────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);

    // Pin setup
    // Use internal pull-up for typical active-low IR modules
    pinMode(ENTRY_PIN, INPUT_PULLUP);
    pinMode(EXIT_PIN,  INPUT_PULLUP);

    // Connect to WiFi
    Serial.printf("\n[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[Device] ID: %s  Server: %s\n\n", DEVICE_ID, SERVER_HOST);
}

// ─────────────────────────────────────────────────────────────
void loop() {
    unsigned long now = millis();

    // ── Entry sensor (IR) ─────────────────────────────────────
    if (isDetected(ENTRY_PIN)) {
        if (now - lastEntryTime > COOLDOWN_MS) {
            lastEntryTime = now;
            Serial.println("[ENTRY] IR sensor triggered");
            sendEvent("entry");
        }
    }

    delay(60); // small gap between measurements

    // ── Exit sensor (IR) ──────────────────────────────────────
    if (isDetected(EXIT_PIN)) {
        if (now - lastExitTime > COOLDOWN_MS) {
            lastExitTime = now;
            Serial.println("[EXIT] IR sensor triggered");
            sendEvent("exit");
        }
    }

    delay(60);
}
