/*
 * ============================================================
 *  QueuePro - ESP32 People Counter (Ultrasonic Version)
 *  Dual HC-SR04 Sensors (Entry + Exit)
 *
 *  Entry sensor triggered -> POST /device/event  { sensor: "entry" } -> count +1
 *  Exit  sensor triggered -> POST /device/event  { sensor: "exit"  } -> count -1
 *
 *  Wiring (each HC-SR04):
 *  - VCC  -> 5V
 *  - GND  -> GND
 *  - TRIG -> ESP32 GPIO (output)
 *  - ECHO -> ESP32 GPIO (input, use voltage divider to 3.3V-safe level)
 *
 *  Entry sensor pins:
 *  - TRIG: GPIO 5
 *  - ECHO: GPIO 18
 *
 *  Exit sensor pins:
 *  - TRIG: GPIO 19
 *  - ECHO: GPIO 21
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// -- CONFIG: update for your setup --
const char* WIFI_SSID      = "Muthuraj";
const char* WIFI_PASSWORD  = "muthu128";
const char* SERVER_HOST    = "http://10.74.242.168:3000";
const char* DEVICE_API_KEY = "ESP32_SECRET_KEY_2026_CHANGE_IN_PRODUCTION";
const char* DEVICE_ID      = "ESP32_001";

// Distance threshold for detection (cm)
const float DETECT_DISTANCE_CM = 20.0f;

// Cooldown per sensor to prevent double count (ms)
const unsigned long COOLDOWN_MS = 2000;

// -- PIN DEFINITIONS --
#define ENTRY_TRIG_PIN 5
#define ENTRY_ECHO_PIN 18
#define EXIT_TRIG_PIN  19
#define EXIT_ECHO_PIN  21

unsigned long lastEntryTime = 0;
unsigned long lastExitTime  = 0;

float readDistanceCm(int trigPin, int echoPin) {
    // Trigger pulse: LOW(2us) -> HIGH(10us) -> LOW
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    // Timeout at ~25ms (~4m max distance)
    unsigned long duration = pulseIn(echoPin, HIGH, 25000UL);

    if (duration == 0) {
        return -1.0f; // no valid echo
    }

    // Distance (cm) = duration(us) * 0.0343 / 2
    return (duration * 0.0343f) / 2.0f;
}

bool isDetected(int trigPin, int echoPin) {
    float distance = readDistanceCm(trigPin, echoPin);
    if (distance < 0.0f) {
        return false;
    }
    return distance <= DETECT_DISTANCE_CM;
}

void sendEvent(const char* sensorType) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Not connected - skipping event send");
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

    Serial.printf("[HTTP] POST %s body=%s\n", url.c_str(), body.c_str());
    int httpCode = http.POST(body);

    if (httpCode > 0) {
        String response = http.getString();
        Serial.printf("[HTTP] Response %d: %s\n", httpCode, response.c_str());
    } else {
        Serial.printf("[HTTP] Error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
}

void setup() {
    Serial.begin(115200);
    delay(500);

    pinMode(ENTRY_TRIG_PIN, OUTPUT);
    pinMode(ENTRY_ECHO_PIN, INPUT);
    pinMode(EXIT_TRIG_PIN, OUTPUT);
    pinMode(EXIT_ECHO_PIN, INPUT);

    digitalWrite(ENTRY_TRIG_PIN, LOW);
    digitalWrite(EXIT_TRIG_PIN, LOW);

    Serial.printf("\n[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[Device] ID: %s Server: %s\n", DEVICE_ID, SERVER_HOST);
    Serial.printf("[Ultrasonic] Threshold: %.1f cm\n\n", DETECT_DISTANCE_CM);
}

void loop() {
    unsigned long now = millis();

    if (isDetected(ENTRY_TRIG_PIN, ENTRY_ECHO_PIN)) {
        if (now - lastEntryTime > COOLDOWN_MS) {
            lastEntryTime = now;
            Serial.println("[ENTRY] Ultrasonic sensor triggered");
            sendEvent("entry");
        }
    }

    delay(60);

    if (isDetected(EXIT_TRIG_PIN, EXIT_ECHO_PIN)) {
        if (now - lastExitTime > COOLDOWN_MS) {
            lastExitTime = now;
            Serial.println("[EXIT] Ultrasonic sensor triggered");
            sendEvent("exit");
        }
    }

    delay(60);
}
