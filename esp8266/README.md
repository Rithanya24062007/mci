ESP8266 folder

Contains ESP8266-compatible sketches for the people counter and queue monitor.

Files:
- people_counter_esp8266.ino  — IR-based people counter (use GPIO5 and GPIO4 by default)
- queue_monitor_esp8266.ino   — Queue monitor sketch for ESP8266

Quick steps to use
1. In Arduino IDE install "ESP8266" boards package (Tools → Board → Boards Manager → search "esp8266").
2. Select board (e.g., "NodeMCU 1.0 (ESP-12E Module)").
3. Set correct `Upload Speed` and `Flash Size` if needed.
4. Set your WiFi credentials and server URL inside the sketches.
5. Compile and upload to the ESP8266 device (select the correct COM port).

Notes
- Default IR polarity is active-low (use `INPUT_PULLUP`). If your IR module is active-high, change `IR_ACTIVE_STATE` to `HIGH` and use `pinMode(..., INPUT)` if you have external pull-down.
- GPIO4/5 are commonly available on NodeMCU/ESP-12 modules; avoid pins used by flash/boot if you change wiring.
