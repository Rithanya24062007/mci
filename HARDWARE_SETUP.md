# ESP32 Hardware Setup Guide

## Components Required

1. ESP32 Development Board (1x)
2. HC-SR04 Ultrasonic Sensors (2x)
3. Breadboard (1x)
4. Jumper Wires (Male-to-Male and Male-to-Female)
5. USB Cable for ESP32
6. Power Supply (5V)

## Circuit Diagram

### Entry Sensor (Sensor 1)
```
HC-SR04 (Entry)          ESP32
===============          =====
VCC         ---------->  5V
GND         ---------->  GND
TRIG        ---------->  GPIO 5
ECHO        ---------->  GPIO 18
```

### Exit Sensor (Sensor 2)
```
HC-SR04 (Exit)           ESP32
==============           =====
VCC         ---------->  5V
GND         ---------->  GND
TRIG        ---------->  GPIO 19
ECHO        ---------->  GPIO 21
```

## Physical Installation

### Sensor Placement

```
                    ENTRY ZONE
                    ==========
                    [SENSOR 1]
                    HC-SR04 Entry
                         |
                         |
                    [ DOORWAY ]
                         |
                         |
          <-- People Enter Here
                         |
    =====================================
    |                                   |
    |         WAITING AREA              |
    |        (QUEUE ZONE)               |
    |                                   |
    =====================================
                         |
          People Exit Here -->
                         |
                         |
                    [ DOORWAY ]
                         |
                         |
                    [SENSOR 2]
                    HC-SR04 Exit
                    ==========
                    EXIT ZONE
```

### Installation Tips

1. **Height:** Mount sensors at waist height (approximately 90-100 cm from ground)

2. **Distance:** Place sensors about 30-50 cm from the doorway

3. **Angle:** Point sensors perpendicular to the path of movement

4. **Detection Range:** Configure detection distance (default 50 cm)

5. **Avoid Interference:** Keep sensors at least 1 meter apart to prevent crosstalk

## Wiring Guide

### Step-by-Step Connection

1. **Power Connections:**
   - Connect both HC-SR04 VCC to ESP32 5V pin
   - Connect both HC-SR04 GND to ESP32 GND

2. **Entry Sensor (Sensor 1):**
   - TRIG → GPIO 5
   - ECHO → GPIO 18

3. **Exit Sensor (Sensor 2):**
   - TRIG → GPIO 19
   - ECHO → GPIO 21

### Breadboard Layout

```
      ESP32                     Breadboard
   +----------+            +-----------------+
   |          |            |                 |
   |  5V  ----+----------->|  Power Rail (+) |
   |  GND ----+----------->|  Power Rail (-) |
   |          |            |                 |
   |  GPIO 5  +---o Entry Sensor TRIG       |
   |  GPIO 18 +---o Entry Sensor ECHO       |
   |          |                              |
   |  GPIO 19 +---o Exit Sensor TRIG        |
   |  GPIO 21 +---o Exit Sensor ECHO        |
   |          |                              |
   +----------+            +-----------------+

   o = Jumper wire connection
```

## Voltage Considerations

**IMPORTANT:** HC-SR04 sensors work with 5V, but ESP32 GPIO pins are 3.3V tolerant.

### Safe Connection Method

The ECHO pin output from HC-SR04 is 5V, which can potentially damage ESP32 GPIO pins. Use one of these methods:

**Method 1: Voltage Divider (Recommended)**
```
HC-SR04 ECHO ----[1kΩ]---- ESP32 GPIO
                    |
                   [2kΩ]
                    |
                   GND
```

**Method 2: Level Shifter Module**
Use a bi-directional level shifter between HC-SR04 ECHO and ESP32 GPIO

**Method 3: Direct Connection (Risk)**
Many ESP32 boards have input protection, so direct connection often works, but it's not guaranteed safe.

## Testing the Setup

1. **Upload Test Code:**
   - Upload the esp32_queue_monitor.ino to your ESP32
   - Open Serial Monitor (115200 baud)

2. **Check Connections:**
   - You should see WiFi connection status
   - Wave your hand in front of Entry sensor - should detect
   - Wave your hand in front of Exit sensor - should detect

3. **Verify Serial Output:**
```
Token Reservation System - Queue Monitor
=========================================
Connecting to WiFi: YourWiFiSSID
.......
WiFi connected!
IP Address: 192.168.1.XXX
Server URL: http://192.168.1.100:3000/api/queue/update

>>> ENTRY DETECTED <<<
Sending entry to server...
Server response: {"success":true,"currentCount":1}
HTTP Response code: 200
-----------------------------------
```

## Troubleshooting Hardware

### Sensor Not Detecting

1. Check power connections (VCC and GND)
2. Verify GPIO pin numbers in code match wiring
3. Test individual sensors with simple sketch
4. Ensure sensor is not too close or far from target
5. Check for obstructions in sensor path

### Inconsistent Detection

1. Adjust DETECTION_DISTANCE in code
2. Increase DETECTION_DELAY to prevent double-counting
3. Ensure stable power supply
4. Check for electromagnetic interference
5. Keep sensors away from metal surfaces

### WiFi Connection Issues

1. Verify 2.4GHz WiFi network
2. Check SSID and password in code
3. Ensure ESP32 is within WiFi range
4. Try different WiFi channels
5. Check if network allows IoT devices

## Power Supply Options

### Option 1: USB Power (Development)
- Connect ESP32 via USB cable to computer
- Suitable for testing and development

### Option 2: External 5V Adapter (Production)
- Use 5V 2A power adapter
- Connect to VIN and GND pins
- Suitable for permanent installation

### Option 3: Battery Power (Portable)
- Use 18650 battery with holder
- Add voltage regulator (7805 or buck converter)
- Calculate battery life based on consumption

## Calibration

### Adjusting Detection Parameters

In the Arduino code, you can adjust:

```cpp
#define DETECTION_DISTANCE 50  // Increase for longer range
#define DETECTION_DELAY 2000   // Increase to prevent double-counting
```

### Finding Optimal Values

1. Start with default values
2. Wave hand at different distances
3. Note when detection occurs
4. Adjust DETECTION_DISTANCE accordingly
5. Test with multiple people passing

## Safety Considerations

1. Use proper insulation for wiring
2. Ensure stable mounting for sensors
3. Keep electronics away from water
4. Use appropriate power supply
5. Follow electrical safety guidelines

## Maintenance

1. **Weekly:** Check all connections
2. **Monthly:** Clean sensor surfaces
3. **Quarterly:** Verify detection accuracy
4. **Annually:** Replace jumper wires if needed

---

For questions about hardware setup, refer to ESP32 and HC-SR04 datasheets.
