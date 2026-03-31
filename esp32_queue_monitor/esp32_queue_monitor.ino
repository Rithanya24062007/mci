/*
 * Token Reservation System - ESP32 Queue Monitor
 * 
 * Hardware Setup:
 * - ESP32 Board
 * - Entry Sensor (IR):
 *   - Output Pin: GPIO 5
 * - Exit Sensor (IR):
 *   - Output Pin: GPIO 19
 * 
 * This code monitors people entering and exiting the queue using IR sensors
 * and sends updates to the Node.js server via HTTP requests.
 */

#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials - CHANGE THESE TO YOUR NETWORK
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL - Change IP if your server runs on a different computer
const char* serverUrl = "http://192.168.1.100:3000/api/queue/update";

// IR sensor pins (digital outputs)
#define ENTRY_PIN 5
#define EXIT_PIN 19

// IR active state: typical IR modules pull LOW when object detected.
// Change to HIGH if your module is active-high.
const int IR_ACTIVE_STATE = LOW;

// Detection cooldown in ms to avoid multiple detections
const unsigned long DETECTION_DELAY = 2000;

// State variables
bool entryDetected = false;
bool exitDetected = false;
unsigned long lastEntryTime = 0;
unsigned long lastExitTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("Token Reservation System - Queue Monitor");
  Serial.println("=========================================");
  
  // Initialize IR sensor pins (use internal pull-up for active-low modules)
  pinMode(ENTRY_PIN, INPUT_PULLUP);
  pinMode(EXIT_PIN, INPUT_PULLUP);
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Read entry sensor (IR)
  bool entryState = (digitalRead(ENTRY_PIN) == IR_ACTIVE_STATE);
  // Read exit sensor (IR)
  bool exitState  = (digitalRead(EXIT_PIN)  == IR_ACTIVE_STATE);

  unsigned long currentTime = millis();

  // Check for entry detection
  if (entryState) {
    if (!entryDetected && (currentTime - lastEntryTime > DETECTION_DELAY)) {
      entryDetected = true;
      lastEntryTime = currentTime;
      handleEntry();
    }
  } else {
    entryDetected = false;
  }

  // Check for exit detection
  if (exitState) {
    if (!exitDetected && (currentTime - lastExitTime > DETECTION_DELAY)) {
      exitDetected = true;
      lastExitTime = currentTime;
      handleExit();
    }
  } else {
    exitDetected = false;
  }
  
  delay(100); // Small delay between readings
}

// Connect to WiFi
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
    Serial.println("Please check your credentials and try again.");
  }
}

// Note: ultrasonic measurement removed — using simple digital IR sensors now

// Handle person entry
void handleEntry() {
  Serial.println(">>> ENTRY DETECTED <<<");
  sendUpdateToServer("entry");
}

// Handle person exit
void handleExit() {
  Serial.println(">>> EXIT DETECTED <<<");
  sendUpdateToServer("exit");
}

// Send update to server
void sendUpdateToServer(String action) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send update - WiFi not connected");
    return;
  }
  
  HTTPClient http;
  
  Serial.print("Sending ");
  Serial.print(action);
  Serial.println(" to server...");
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  String payload = "{\"action\":\"" + action + "\"}";
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Server response: ");
    Serial.println(response);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error sending request: ");
    Serial.println(httpResponseCode);
    Serial.println("Make sure the server is running and the URL is correct");
  }
  
  http.end();
  Serial.println("-----------------------------------");
}
