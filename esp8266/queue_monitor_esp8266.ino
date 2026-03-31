/*
 * Token Reservation System - ESP8266 Queue Monitor (IR sensors)
 *
 * Wiring:
 * - ENTRY -> GPIO5
 * - EXIT  -> GPIO4
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:3000/api/queue/update";

#define ENTRY_PIN 5
#define EXIT_PIN 4
const int IR_ACTIVE_STATE = LOW;
const unsigned long DETECTION_DELAY = 2000;

bool entryDetected = false;
bool exitDetected = false;
unsigned long lastEntryTime = 0;
unsigned long lastExitTime = 0;

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Server URL: ");
    Serial.println(serverUrl);
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Token Reservation System - Queue Monitor");

  pinMode(ENTRY_PIN, INPUT_PULLUP);
  pinMode(EXIT_PIN, INPUT_PULLUP);

  connectToWiFi();
}

long nowMillis() { return millis(); }

void handleEntry() {
  Serial.println(">>> ENTRY DETECTED <<<");
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String payload = "{\"action\":\"entry\"}";
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Server response: ");
      Serial.println(response);
    } else {
      Serial.print("Error sending request: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void handleExit() {
  Serial.println(">>> EXIT DETECTED <<<");
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String payload = "{\"action\":\"exit\"}";
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Server response: ");
      Serial.println(response);
    } else {
      Serial.print("Error sending request: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  bool entryState = (digitalRead(ENTRY_PIN) == IR_ACTIVE_STATE);
  bool exitState  = (digitalRead(EXIT_PIN)  == IR_ACTIVE_STATE);
  unsigned long currentTime = nowMillis();

  if (entryState) {
    if (!entryDetected && (currentTime - lastEntryTime > DETECTION_DELAY)) {
      entryDetected = true;
      lastEntryTime = currentTime;
      handleEntry();
    }
  } else {
    entryDetected = false;
  }

  if (exitState) {
    if (!exitDetected && (currentTime - lastExitTime > DETECTION_DELAY)) {
      exitDetected = true;
      lastExitTime = currentTime;
      handleExit();
    }
  } else {
    exitDetected = false;
  }

  delay(100);
}
