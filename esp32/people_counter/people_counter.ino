/*
 * ============================================================
 *  QueuePro — ESP32 People Counter
 *  Dual HC-SR04 Ultrasonic Sensor (Entry + Exit)
 *
 *  Entry sensor triggered  → POST /device/event  { sensor: "entry" }  → count +1
 *  Exit  sensor triggered  → POST /device/event  { sensor: "exit"  }  → count -1
 *
 *  Wiring:
 *  ┌──────────────┬────────────┐
 *  │ HC-SR04 Pin  │ ESP32 GPIO │
 *  ├──────────────┼────────────┤
 *  │ ENTRY TRIG   │ GPIO 5     │
 *  │ ENTRY ECHO   │ GPIO 18    │
 *  │ EXIT  TRIG   │ GPIO 19    │
 *  │ EXIT  ECHO   │ GPIO 21    │
 *  │ VCC          │ 5V         │
 *  │ GND          │ GND        │
 *  └──────────────┴────────────┘
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>        // Install: Arduino Library Manager → "ArduinoJson" by Benoit Blanchon

// ── CONFIG — CHANGE THESE ────────────────────────────────────
const char* WIFI_SSID      = "vishal";
const char* WIFI_PASSWORD  = "12345678";

// Your PC's local IP address (run `ipconfig` on Windows to find it)
const char* SERVER_HOST    = "http://10.229.158.168:3000";

// Must match ESP32_API_KEY in backend/.env
const char* DEVICE_API_KEY = "ESP32_SECRET_KEY_2026_CHANGE_IN_PRODUCTION";

// Must match the device_id you mapped in Admin → Device Mapping
const char* DEVICE_ID      = "ESP32_001";

// Detection threshold in cm — trigger when object closer than this
const int   DETECT_THRESHOLD_CM = 80;

// Cooldown between detections on same sensor (ms) — prevents double-count
const unsigned long COOLDOWN_MS = 2000;
// ─────────────────────────────────────────────────────────────

// ── PIN DEFINITIONS ──────────────────────────────────────────
#define ENTRY_TRIG  5
#define ENTRY_ECHO  18
#define EXIT_TRIG   19
#define EXIT_ECHO   21
// ─────────────────────────────────────────────────────────────

unsigned long lastEntryTime = 0;
unsigned long lastExitTime  = 0;

// ─────────────────────────────────────────────────────────────
// Measure distance with HC-SR04 (returns cm, -1 on timeout)
// ─────────────────────────────────────────────────────────────
float measureDistance(int trigPin, int echoPin) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout ≈ 510cm max
    if (duration == 0) return -1;                  // timeout / no echo
    return (duration * 0.0343f) / 2.0f;            // convert µs → cm
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
    pinMode(ENTRY_TRIG, OUTPUT);
    pinMode(ENTRY_ECHO, INPUT);
    pinMode(EXIT_TRIG,  OUTPUT);
    pinMode(EXIT_ECHO,  INPUT);

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

    // ── Entry sensor ──────────────────────────────────────────
    float entryDist = measureDistance(ENTRY_TRIG, ENTRY_ECHO);
    if (entryDist > 0 && entryDist < DETECT_THRESHOLD_CM) {
        if (now - lastEntryTime > COOLDOWN_MS) {
            lastEntryTime = now;
            Serial.printf("[ENTRY] Object detected at %.1f cm\n", entryDist);
            sendEvent("entry");
        }
    }

    delay(60); // small gap between measurements

    // ── Exit sensor ───────────────────────────────────────────
    float exitDist = measureDistance(EXIT_TRIG, EXIT_ECHO);
    if (exitDist > 0 && exitDist < DETECT_THRESHOLD_CM) {
        if (now - lastExitTime > COOLDOWN_MS) {
            lastExitTime = now;
            Serial.printf("[EXIT]  Object detected at %.1f cm\n", exitDist);
            sendEvent("exit");
        }
    }

    delay(60);
}
