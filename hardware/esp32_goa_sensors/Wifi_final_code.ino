// ===== WiFi and MQTT config =====
#define SerialMon Serial
#define MQTT_MAX_PACKET_SIZE 512

#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <WiFi.h>

// ===== Displays =====
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include <esp_now.h>

// Global variables
float temp1;
int moisture1;
float hum1;

// Structure to receive data via ESP-NOW
typedef struct struct_message {
  int moistureValue;
  float temperature;
  float humidity;
} struct_message;

struct_message incomingData;

// ===== WiFi Credentials =====
// Set your farm WiFi before flashing (do not commit real passwords).
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ===== MQTT Config =====
const char* mqtt_broker   = "broker.hivemq.com";
int         mqtt_port     = 1883;
const char* mqtt_user     = "krishi1";
const char* mqtt_pass     = "krishi1";
const char* publish_topic = "krishimithr/sensor/data";
const char* subs_topic    = "krishimithr/device/cmd"; // commands from dashboard

// ===== Pins (adjust if needed) =====
// Sensors
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define PIR_PIN 27
#define SOIL_PIN 35
#define RAIN_PIN 34
#define MQ135_PIN 26
#define LDR_DIGITAL_PIN 25
#define TDS_PIN 32

// Relays (verify active HIGH/LOW for your board)
#define RELAY_MOTOR_PIN 2   // Relay 1: Motor
#define RELAY_HV_PIN    23  // Relay 2: HV generator (auto via motion when enabled)

// I2C: default ESP32 SDA 21, SCL 22
#define I2C_SDA 21
#define I2C_SCL 22

// OLED display config
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// LCD 16x2 at 0x27 (change if needed)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Slideshow button
#define BTN_PIN 13
bool motorOnFromDashboard = false;
unsigned long motorAlertStart = 0;
bool motorAlertPending = false;
int soilPercent = 0;
int tdsPPM = 0;
int rainPercent = 0;
unsigned long lastReconnectAttempt = 0;

// ===== WiFi and MQTT Clients =====
WiFiClient netClient;
PubSubClient mqtt(netClient);

// ===== ADC/MQ135 =====
#define VREF 3.3
#define RL   10000.0
#define R0   20000.0

float getPPM(float ratio, float a, float b) {
  return a * pow(ratio, b);
}

// ===== Relay states + Auto HV mode =====
bool motorOn = false;
bool hvOn = false;
bool hvAutoEnable = true;
uint32_t hvAutoOnDurationMs = 5000;
uint32_t hvAutoLastOn = 0;

// ===== Status flags for LCD =====
bool wifiReady = false;
bool mqttReady = false;
bool lastPublishOK = false;

// ===== Slideshow state =====
volatile bool btnPressed = false;
uint8_t pageIndex = 0;
uint32_t lastPageRender = 0;
const uint32_t pageRenderIntervalMs = 200;
uint32_t lastDebounce = 0;

// ===== Helpers =====
void setMotor(bool on) {
  motorOn = on;
  digitalWrite(RELAY_MOTOR_PIN, on ? HIGH : LOW);
}

void setHV(bool on) {
  hvOn = on;
  digitalWrite(RELAY_HV_PIN, on ? HIGH : LOW);
}

// ===== MQTT command parsing =====
void mqttCallback(char* topic, byte* message, unsigned int len) {
  String cmd;
  for (unsigned int i = 0; i < len; i++) cmd += (char)message[i];
  cmd.trim();
  cmd.toLowerCase();
  SerialMon.print("MQTT cmd: "); SerialMon.println(cmd);

  if (cmd == "motor:on") {
    setMotor(true);
    motorOnFromDashboard = true;
  } else if (cmd == "motor:off") {
    setMotor(false);
    motorOnFromDashboard = false;
  } else if (cmd == "hv:on") {
    hvAutoEnable = false;
    setHV(true);
  } else if (cmd == "hv:off") {
    hvAutoEnable = false;
    setHV(false);
  } else if (cmd == "hv_auto:on") {
    hvAutoEnable = true;
  } else if (cmd == "hv_auto:off") {
    hvAutoEnable = false;
    setHV(false);
  } else {
    SerialMon.println("Unknown command");
  }
}

// ===== MQTT connect =====
bool mqttConnect() {
  SerialMon.print("Connecting MQTT...");
  // Unique client ID to prevent broker disconnection conflicts
  bool ok = mqtt.connect("KrishiMithrClient_237Y1A04G7", mqtt_user, mqtt_pass);
  if (!ok) {
    SerialMon.println(" fail");
    mqttReady = false;
    return false;
  }
  SerialMon.println(" success");
  mqtt.subscribe(subs_topic);
  mqttReady = true;
  return true;
}

// ===== LCD status update =====
void updateLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SIM:");
  lcd.print(wifiReady ? "OK" : "FAIL");
  lcd.print(" MQTT:");
  lcd.print(mqttReady ? "OK" : "WAIT");

  lcd.setCursor(0, 1);
  lcd.print("PUB:");
  lcd.print(lastPublishOK ? "OK " : "FAIL");
  lcd.print("M:");
  lcd.print(motorOn ? "ON" : "OFF");
  lcd.print(" H:");
  lcd.print(hvOn ? "ON" : "OFF");
}

// ===== OLED blue-themed header =====
void drawHeader(const char* title) {
  oled.fillRect(0, 0, SCREEN_WIDTH, 12, SSD1306_WHITE);
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_BLACK);
  oled.setCursor(2, 2);
  oled.print(title);
  oled.setTextColor(SSD1306_WHITE);
}

// ===== Slideshow pages =====
void renderPage0(float temp, float hum, int soilPercent, float rainPercent, const String& rainStatus) {
  oled.clearDisplay();
  drawHeader("Env: Temp/Hum/Soil/Rain");
  oled.setTextSize(1);
  oled.setCursor(0, 16);
  oled.printf("Temp: %.1f C", temp);
  oled.setCursor(0, 26);
  oled.printf("Hum : %.1f %%", hum);
  oled.setCursor(0, 36);
  oled.printf("Soil: %d %%", soilPercent);
  oled.setCursor(0, 46);
  oled.printf("Rain: %.0f %%", rainPercent);
  oled.setCursor(0, 56);
  oled.print("Status: "); oled.print(rainStatus);
  oled.display();
}

void renderPage1(const String& lightStatus, int motion, const String& airQual,
                 float ppmCO2, float ppmNH3, float ppmBenzene, float ppmSmoke) {
  oled.clearDisplay();
  drawHeader("Air/Motion/Light");
  oled.setTextSize(1);
  oled.setCursor(0, 16);
  oled.print("Light: ");
  if (lightStatus == "Light") oled.print("Light");
  else oled.print("Dark");
  oled.setCursor(0, 26);
  oled.print("Motion: "); oled.print(motion == HIGH ? "Detected" : "None");
  oled.setCursor(0, 36);
  oled.print("AirQ: "); oled.print(airQual);
  oled.setCursor(0, 56);
  oled.printf("Ben: %.0f Smoke: %.0f", ppmBenzene, ppmSmoke);
  oled.display();
}

void renderPage2(float tdsPPM, const String& waterStatus, bool motor, bool hv, bool hvAuto) {
  oled.clearDisplay();
  drawHeader("Water/Relays");
  oled.setTextSize(1);
  oled.setCursor(0, 16);
  oled.printf("TDS: %.0f ppm", tdsPPM);
  oled.setCursor(0, 26);
  oled.print("Water: "); oled.print(waterStatus);
  oled.setCursor(0, 38);
  oled.print("Motor: "); oled.print(motor ? "ON" : "OFF");
  oled.setCursor(0, 48);
  oled.print("HV   : "); oled.print(hv ? "ON" : "OFF");
  oled.setCursor(0, 58);
  oled.print("HV Auto: "); oled.print(hvAuto ? "ON" : "OFF");
  oled.display();
}

// ===== Button handling (debounce) =====
void IRAM_ATTR onButton() {
  btnPressed = true;
}

// ===== ESP-NOW Data Receive (ESP32 Core v3.x Signature) =====
void onDataRecv(const esp_now_recv_info *info, const uint8_t *incomingDataBytes, int len) {
  memcpy(&incomingData, incomingDataBytes, sizeof(incomingData));

  temp1 = incomingData.temperature;
  moisture1 = incomingData.moistureValue;
  hum1 = incomingData.humidity;

  Serial.print("ESP-NOW Temp: "); Serial.println(temp1);
  Serial.print("ESP-NOW Humidity: "); Serial.println(hum1);
  Serial.print("ESP-NOW Moisture: "); Serial.println(moisture1);
}

// ===== Setup =====
void setup() {
  SerialMon.begin(115200);

  // ESP-NOW setup
  WiFi.mode(WIFI_STA);
  Serial.print("ESP32 Receiver MAC Address: ");
  Serial.println(WiFi.macAddress());

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register ESP-NOW receive callback
  esp_now_register_recv_cb(onDataRecv);

  dht.begin();

  pinMode(PIR_PIN, INPUT);
  pinMode(LDR_DIGITAL_PIN, INPUT);
  pinMode(RELAY_MOTOR_PIN, OUTPUT);
  pinMode(RELAY_HV_PIN, OUTPUT);
  setMotor(false);
  setHV(false);

  // Button
  pinMode(BTN_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BTN_PIN), onButton, FALLING);
  
  // I2C and displays
  Wire.begin(I2C_SDA, I2C_SCL);

  // OLED init
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    SerialMon.println("OLED init failed");
  } else {
    oled.clearDisplay();
    drawHeader("welcome Krishi Mithr ");
    oled.setTextSize(1);
    oled.setCursor(0, 18);
    oled.print("Booting...");
    oled.display();
  }

  // LCD init
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Welcome");
  lcd.setCursor(0, 1);
  lcd.print("Krishi Mithr...");
  delay(1000);

  // ===== CONNECT TO WIFI =====
  WiFi.begin(ssid, password);
  SerialMon.print("Connecting to WiFi");
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    SerialMon.print(".");
    if (millis() - startAttemptTime > 15000) {
      SerialMon.println("\nWiFi Connection Failed!");
      break;
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    SerialMon.println(" connected");
    SerialMon.print("IP Address: ");
    SerialMon.println(WiFi.localIP());
    wifiReady = true;
  }

  // Initialize MQTT
  mqtt.setServer(mqtt_broker, mqtt_port);
  mqtt.setCallback(mqttCallback);

  updateLCD();
}

// ===== Main Loop =====
void loop() {
  // Debounce button and cycle pages
  if (btnPressed && (millis() - lastDebounce > 250)) {
    lastDebounce = millis();
    btnPressed = false;
    pageIndex = (pageIndex + 1) % 3;
  }

  // Keep MQTT connection alive
  if (!mqtt.connected()) {
    mqttReady = false;
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      if (mqttConnect()) {
        lastReconnectAttempt = 0;
      }
    }
  } else {
    mqtt.loop();
  }

  // Periodic publish
  static uint32_t lastSend = 0;
  if (millis() - lastSend > 5000) {
    lastSend = millis();
    send_data();
  }

  // Auto HV control
  int motion = digitalRead(PIR_PIN);
  if (hvAutoEnable && motion == HIGH) {
    setHV(true);
    hvAutoLastOn = millis();
  }
  if (hvOn && hvAutoEnable && (millis() - hvAutoLastOn > hvAutoOnDurationMs)) {
    setHV(false);
  }
}

// ===== Sensor sampling + MQTT publish + display render =====
void send_data() {
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  if (isnan(temp) || isnan(hum)) {
    SerialMon.println("DHT read failed");
    // Proceed anyway with default values so other sensors keep publishing
    temp = 0.0;
    hum = 0.0;
  }

  // Motion
  int motion = digitalRead(PIR_PIN);
  if (hvAutoEnable) {
    if (motion) {
      setHV(true);
    } else {
      setHV(false);
    }
  }

  // Soil moisture update
  int soilRaw = analogRead(SOIL_PIN);
  soilPercent = map(soilRaw, 4095, 1500, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);
  Serial.println("Soil Moisture: " + String(soilPercent));

  // Optional auto motor control
 /* int soilThreshold = 30;
  if (soilPercent < soilThreshold) setMotor(true);
  else setMotor(false);*/

  // Rain
  int rainValue = analogRead(RAIN_PIN);
  float rainPercent = map(rainValue, 4095, 0, 0, 100);
  rainPercent = constrain(rainPercent, 0, 100);
  String rainStatus = 
      (rainPercent < 20)  ? "No Rain" :
      (rainPercent < 40)  ? "Light Rain" :
      (rainPercent < 70)  ? "Moderate Rain" :
                            "Heavy Rain";

  // LDR digital
  int ldrState = digitalRead(LDR_DIGITAL_PIN);
  String lightStatus = (ldrState == LOW) ? "Light" : "Dark";

  // TDS update
  const int SCOUNT = 30;
  long tdsSum = 0;
  for (int i = 0; i < SCOUNT; i++) { 
    tdsSum += analogRead(TDS_PIN); 
    delay(5); 
  }
  float tdsAvg = (float)tdsSum / SCOUNT;
  float tdsVoltage = tdsAvg * (VREF / 4095.0);
  tdsPPM = (133.42 * tdsVoltage * tdsVoltage * tdsVoltage
          - 255.86 * tdsVoltage * tdsVoltage
          + 857.39 * tdsVoltage) * 0.5;
  Serial.println("TDS: " + String(tdsPPM));

  String waterStatus;
  if (tdsPPM <= 10) {
    waterStatus = "Pure Water";
  } else if (tdsPPM <= 300) {
    waterStatus = "Tap Water";
  } else if (tdsPPM <= 500) {
    waterStatus = "Safe Drinking";
  } else if (tdsPPM > 1000) {
    waterStatus = "Fertilizer Sol";
  } else {
    waterStatus = "Moderate";
  }

  // MQ135
  int mqAdc = analogRead(MQ135_PIN);
  float mqVolt = mqAdc * (VREF / 4095.0);
  float Rsensor = (mqVolt > 0.01f) ? (VREF - mqVolt) * RL / mqVolt : 1e6;
  float ratio = Rsensor / R0;
  float ppmCO2     = getPPM(ratio, 110.0, -2.9);
  float ppmNH3     = getPPM(ratio, 150.0, -2.3);
  float ppmBenzene = getPPM(ratio,  90.0, -2.7);
  float ppmSmoke   = getPPM(ratio,  80.0, -2.5);

  String airQualityStatus;
  if (ppmCO2 < 1000 && ppmNH3 < 25 && ppmBenzene < 10 && ppmSmoke < 100) {
    airQualityStatus = "Good";
  } else if (ppmCO2 < 2000 && ppmNH3 < 50 && ppmBenzene < 20 && ppmSmoke < 200) {
    airQualityStatus = "Moderate";
  } else if (ppmCO2 < 5000 && ppmNH3 < 100 && ppmBenzene < 50 && ppmSmoke < 400) {
    airQualityStatus = "Poor";
  } else {
    airQualityStatus = "Hazardous";
  }

  // Build JSON — field names match Krishi Mithr Mongo / XGBoost ingest
  char payload[768];
  StaticJsonDocument<768> doc;
  doc["device_id"]     = "esp32_goa";
  doc["location"]      = "farm_field_1";
  doc["temperature"]   = temp;
  doc["humidity"]      = hum;
  doc["motion"]        = motion;
  doc["soilMoisture"]  = soilPercent;
  doc["raindata"]      = rainPercent;
  doc["light"]         = ldrState;
  doc["tds_ppm"]       = tdsPPM;
  doc["TDS"]           = tdsPPM;          // SIH / XGBoost alias
  doc["waterStatus"]   = waterStatus;
  doc["AirQuality"]    = airQualityStatus;
  doc["CO2_ppm"]       = ppmCO2;
  doc["NH3_ppm"]       = ppmNH3;
  doc["Benzene_ppm"]   = ppmBenzene;
  doc["Smoke_ppm"]     = ppmSmoke;
  doc["motor"]         = motorOn;
  doc["hv"]            = hvOn;
  doc["hv_auto"]       = hvAutoEnable;
  serializeJson(doc, payload, sizeof(payload));

  // Publish
  if (!mqtt.connected()) {
    mqttConnect();
  }
  
  if (mqtt.connected()) {
    mqtt.loop();
    lastPublishOK = mqtt.publish(publish_topic, payload);
    SerialMon.println(lastPublishOK ? "Published successfully!" : "Publish fail - Packet rejected by broker");
    updateLCD();
  } else {
    SerialMon.println("MQTT not connected, skipping publish");
    lastPublishOK = false;
    updateLCD();
  }

  // Render current OLED page
  if (millis() - lastPageRender > pageRenderIntervalMs) {
    lastPageRender = millis();
    switch (pageIndex) {
      case 0:
        renderPage0(temp, hum, soilPercent, rainPercent, rainStatus);
        break;
      case 1:
        renderPage1(lightStatus, motion, airQualityStatus, ppmCO2, ppmNH3, ppmBenzene, ppmSmoke);
        break;
      case 2:
        renderPage2(tdsPPM, waterStatus, motorOn, hvOn, hvAutoEnable);
        break;
    }
  }
}