/*
 * Krishi Mithr — ESP32-CAM periodic diagnose upload (AI Thinker pinout)
 *
 * Arduino IDE board: "AI Thinker ESP32-CAM"
 * Sensors stay on MQTT. This sketch only uploads JPEG stills.
 *
 * Edit WIFI_*, DIAGNOSE_HOST, optional DEVICE_UPLOAD_KEY, then flash.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WiFiClient.h>

const char *WIFI_SSID = "YOUR_WIFI";
const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";

const char *DIAGNOSE_HOST = "sih-krishi-mithr.onrender.com";
const uint16_t DIAGNOSE_PORT = 443;
const bool USE_HTTPS = true;

const char *DEVICE_UPLOAD_KEY = "";  // must match Render DEVICE_UPLOAD_KEY if set
const char *DEVICE_ID = "esp32-cam";
const unsigned long SCAN_INTERVAL_MS = 60000;
const int PIR_PIN = -1;  // GPIO for PIR, or -1 for interval-only

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

unsigned long lastScanMs = 0;

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    return false;
  }
  return true;
}

bool uploadFrame(const char *trigger) {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture failed");
    return false;
  }

  const char *boundary = "KrishiMithrBoundary";
  String head;
  head.reserve(400);
  head += "--";
  head += boundary;
  head += "\r\nContent-Disposition: form-data; name=\"device_id\"\r\n\r\n";
  head += DEVICE_ID;
  head += "\r\n--";
  head += boundary;
  head += "\r\nContent-Disposition: form-data; name=\"trigger\"\r\n\r\n";
  head += trigger;
  head += "\r\n--";
  head += boundary;
  head += "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"esp32.jpg\"\r\n";
  head += "Content-Type: image/jpeg\r\n\r\n";

  String tail = "\r\n--";
  tail += boundary;
  tail += "--\r\n";

  size_t contentLen = head.length() + fb->len + tail.length();
  String path = "/api/pest/device-scan?annotate=true&top_k=3";

  WiFiClientSecure secure;
  WiFiClient plain;
  Client *client;
  if (USE_HTTPS) {
    secure.setInsecure();
    secure.setTimeout(120);
    if (!secure.connect(DIAGNOSE_HOST, DIAGNOSE_PORT)) {
      Serial.println("TLS connect failed");
      esp_camera_fb_return(fb);
      return false;
    }
    client = &secure;
  } else {
    if (!plain.connect(DIAGNOSE_HOST, DIAGNOSE_PORT)) {
      Serial.println("TCP connect failed");
      esp_camera_fb_return(fb);
      return false;
    }
    client = &plain;
  }

  client->printf("POST %s HTTP/1.1\r\n", path.c_str());
  client->printf("Host: %s\r\n", DIAGNOSE_HOST);
  client->println("Connection: close");
  client->printf("Content-Type: multipart/form-data; boundary=%s\r\n", boundary);
  client->printf("Content-Length: %u\r\n", (unsigned)contentLen);
  if (DEVICE_UPLOAD_KEY[0] != '\0') {
    client->printf("X-Device-Key: %s\r\n", DEVICE_UPLOAD_KEY);
  }
  client->println();
  client->print(head);
  client->write(fb->buf, fb->len);
  client->print(tail);
  esp_camera_fb_return(fb);

  unsigned long start = millis();
  while (client->connected() && !client->available() && millis() - start < 120000) {
    delay(10);
  }

  String statusLine = client->readStringUntil('\n');
  Serial.println(statusLine);
  while (client->available()) {
    String line = client->readStringUntil('\n');
    if (line.length() <= 1) break;  // end of headers
  }
  String body = client->readString();
  Serial.println(body);
  client->stop();

  return statusLine.indexOf("200") >= 0 || statusLine.indexOf("201") >= 0;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nKrishi Mithr ESP32-CAM");

  if (PIR_PIN >= 0) pinMode(PIR_PIN, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.printf("\nIP %s\n", WiFi.localIP().toString().c_str());

  if (!initCamera()) {
    while (true) delay(1000);
  }

  lastScanMs = millis() - SCAN_INTERVAL_MS + 5000;
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(2000);
    return;
  }

  bool motion = (PIR_PIN >= 0) && digitalRead(PIR_PIN);
  bool due = (millis() - lastScanMs) >= SCAN_INTERVAL_MS;

  if (due || motion) {
    const char *trigger = (motion && !due) ? "motion" : "interval";
    if (uploadFrame(trigger)) {
      lastScanMs = millis();
    } else {
      lastScanMs = millis() - SCAN_INTERVAL_MS + 15000;
    }
    if (motion && PIR_PIN >= 0) delay(2000);
  }

  delay(200);
}
