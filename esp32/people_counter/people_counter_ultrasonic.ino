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
 *  - TRIG: GPIO 25
 *  - ECHO: GPIO 26
 *
 *  Exit sensor pins:
 *  - TRIG: GPIO 32
 *  - ECHO: GPIO 33
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
const float DETECT_DISTANCE_CM = 3.0f;

// Cooldown per sensor to prevent double count (ms)
const unsigned long COOLDOWN_MS = 1000;

// -- PIN DEFINITIONS --
#define ENTRY_TRIG_PIN 25
#define ENTRY_ECHO_PIN 26
#define EXIT_TRIG_PIN  32
#define EXIT_ECHO_PIN  33

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

float readSafeDistanceCm(int trigPin, int echoPin) {
    float d = readDistanceCm(trigPin, echoPin);
    if (d < 0.0f) {
        return 999.0f;
    }
    return d;
}

void sendEvent(const char* sensorType) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Not connected - skipping event send");
        return;
    }

    HTTPClient http;
    String url = String(SERVER_HOST) + "/device/event";

    http.begin(url);
    http.setConnectTimeout(3000);  // 3 second timeout
    http.setTimeout(3000);         // 3 second timeout for response
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
    float entryDistance = readSafeDistanceCm(ENTRY_TRIG_PIN, ENTRY_ECHO_PIN);
    float exitDistance = readSafeDistanceCm(EXIT_TRIG_PIN, EXIT_ECHO_PIN);

    if (entryDistance <= DETECT_DISTANCE_CM) {
        if (now - lastEntryTime > COOLDOWN_MS) {
            lastEntryTime = now;
            Serial.println("[ENTRY] Ultrasonic sensor triggered");
            sendEvent("entry");
        }
    }

    delay(60);

    if (exitDistance <= DETECT_DISTANCE_CM) {
        if (now - lastExitTime > COOLDOWN_MS) {
            lastExitTime = now;
            Serial.println("[EXIT] Ultrasonic sensor triggered");
            sendEvent("exit");
        }
    }

    delay(60);
}
