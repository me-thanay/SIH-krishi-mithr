# ESP32-CAM → Krishi Mithr Diagnose

Sensors keep using MQTT (`krishimithr/sensor/data`) as before.  
The camera module only uploads JPEG stills.

## Flow

1. ESP32-CAM captures VGA JPEG every 60s (or on PIR).
2. `POST https://YOUR-API.onrender.com/api/pest/device-scan` (multipart).
3. FastAPI runs locate-then-diagnose and saves to Mongo `camera_scans`.
4. Dashboard **Operations** tab shows **ESP32-CAM last scan** (`/api/camera-scan/latest`).

## Flash

1. Arduino IDE → board **AI Thinker ESP32-CAM**.
2. Edit `esp32_cam_diagnose.ino`: Wi‑Fi, `DIAGNOSE_HOST`, optional `DEVICE_UPLOAD_KEY`.
3. Flash with the board in download mode (GPIO0 held LOW), then reset.

## Render env

- `DATABASE_URL` — same Mongo as sensors (required to store scans).
- `DEVICE_UPLOAD_KEY` — optional shared secret; set the same string in the sketch.
- `INFERENCE_DEVICE=cpu`

## Aim the camera

Close-up of one leaf or insect. Far field shots will often miss or guess wrong.
