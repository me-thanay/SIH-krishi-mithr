# 🌱 Smart AgriTech - AI-Powered Agriculture Platform

A comprehensive agricultural advisory platform that combines AI-powered insights, real-time monitoring, and intelligent recommendations for modern farmers.

## 🚀 Features

- **Real-time Multilingual Crop Advisory** - AI-powered recommendations in local languages
- **Soil Health & Fertilizer Recommendations** - Advanced soil analysis with precise recommendations
- **Weather Alerts & Predictive Insights** - Accurate forecasts and climate-based farming insights
- **Pest & Disease Detection via Photos** - AI-powered image recognition for instant diagnosis
- **Market Price Tracking & Forecasting** - Real-time prices and predictive analytics
- **Voice Support for Low-literate Users** - Voice-enabled interface for accessibility
- **Continuous Learning from Feedback** - AI system that learns from farmer interactions
- **WhatsApp Bot Integration** - Direct support via familiar platform

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icons

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Python-dotenv** - Environment management
- **Structlog** - Structured logging

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Environment Configuration

Copy `env.example` to `.env` and configure:

```bash
# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here
WHATSAPP_VERIFY_TOKEN=kissan_verification_token

# Weather API
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Webhook URL (for production)
WEBHOOK_URL=https://your-domain.com/api/webhook/whatsapp
```

## 🔌 API Endpoints

### Weather Service
- `GET /api/weather/current?city=mumbai` - Current weather
- `GET /api/weather/forecast?city=mumbai` - 5-day forecast
- `GET /api/weather/alerts?city=mumbai` - Weather alerts

### Pest Detection & Plant Diagnosis
- `POST /api/pest/diagnose?annotate=true` - Locate leaves and pests, then classify disease, pest species, and (for maize) suspected nutrient deficiency
- `POST /api/pest/detect` - Locate pests with bounding boxes (102 IP102 pest classes)
- `POST /api/pest/disease` - Classify disease from a single leaf photo
- `POST /api/pest/deficiency` - Classify maize nutrient deficiency from a leaf photo
- `GET /api/pest/disease/classes` - Supported plant/disease classes
- `GET /api/pest/deficiency/classes` - Maize deficiency classes
- `GET /api/pest/pests` - List all known pests
- `GET /api/pest/pest/{pest_name}` - Get pest information

Models live in `ml/models/` (`leaf_pest_yolo.pt`, `ip102_yolo.pt`, `plantdoc_efficientnet_v2_s.pt`, `maize_efficientnet_v2_s.pt`). Training/prep scripts are in `ml/`; install `requirements.ml.txt` first.

### Soil Advisory
- `POST /api/soil/analyze` - Upload soil image for analysis
- `GET /api/soil/types` - List soil types
- `GET /api/soil/recommendations` - Get soil recommendations

### Market Prices
- `GET /api/market/current` - Current commodity prices
- `GET /api/market/commodities` - List available commodities
- `GET /api/market/forecast/{commodity}` - Price forecast
- `GET /api/market/trends/{commodity}` - Price trends

### Dealer Network
- `GET /api/dealers/dealers` - Find dealers
- `GET /api/dealers/dealers/{dealer_id}` - Dealer details
- `GET /api/dealers/products` - Product listings
- `POST /api/dealers/products` - Create product listing
- `POST /api/dealers/deals/request` - Create deal request

### Farming Tools
- `GET /api/tools/tools` - Search farming tools
- `GET /api/tools/tools/{tool_id}` - Tool details
- `GET /api/tools/categories` - Tool categories
- `GET /api/tools/recommendations` - Tool recommendations
- `POST /api/tools/tools/inquiry` - Create tool inquiry

### WhatsApp Webhook
- `GET /api/webhook/whatsapp` - Verify webhook
- `POST /api/webhook/whatsapp` - Receive messages
- `GET /api/webhook/whatsapp/status` - Webhook status

## 📱 WhatsApp Bot Usage

### Phone Number: +91 76709 97498

### Available Commands:
- `kissan` - Activate the bot
- `weather [city]` - Get weather updates
- `pest` + photo - Detect pests in crops
- `soil` + photo - Analyze soil samples
- `price [crop]` - Check market prices
- `dealers [location]` - Find nearby dealers
- `tools [category]` - Browse farming equipment
- `help` - Show all available commands

## 🎨 UI Components

The platform includes a comprehensive set of reusable components:

- **Button** - Customizable button with variants
- **Card** - Content containers with shadows
- **FeatureCard** - Animated feature showcase cards
- **FloatingElement** - Floating animation wrapper
- **ScrollAnimationContainer** - Scroll-triggered animations

## 🌟 Key Features

### Animated UI
- Smooth Framer Motion animations
- Floating background elements
- Scroll-triggered animations
- Interactive hover effects

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions

### Accessibility
- Voice support for low-literate users
- Keyboard navigation
- Screen reader compatibility
- High contrast support

## 🚀 Development

### Frontend Development
```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Backend Development
```bash
# Start with auto-reload
python -m uvicorn app.main:app --reload

# Run tests
pytest

# API documentation
# Visit http://localhost:8000/docs
```

## 📊 Project Structure

```
smart-agritech/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── feature-card.tsx
│   │   │   ├── floating-element.tsx
│   │   │   └── scroll-animation-container.tsx
│   │   └── smart-agri-tech.tsx
│   └── lib/
│       └── utils.ts
├── app/
│   ├── routers/
│   │   ├── weather.py
│   │   ├── pest_detection.py
│   │   ├── soil_advisory.py
│   │   ├── market_prices.py
│   │   ├── dealer_network.py
│   │   ├── farming_tools.py
│   │   └── whatsapp_webhook.py
│   └── main.py
├── package.json
├── requirements.txt
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Deploy: Diagnose (Render API + Vercel frontend)

### Render (FastAPI + ML weights)
1. Connect this GitHub repo in Render (or use Blueprint `render.yaml`).
2. Use **Docker** with `Dockerfile.render`.
3. Set plan to **Standard (2 GB RAM)** — Free/Starter (512 MB) will crash when models load.
4. Env: `INFERENCE_DEVICE=cpu`, `PYTHONPATH=/app`.
5. After deploy, check `https://YOUR-API.onrender.com/health` — `models_present` should all be `true`.
6. First Diagnose call can take 30–90s while models load; later calls are faster.

### Vercel (Next.js)
1. Import the same GitHub repo in Vercel.
2. Set Production env:
   - `NEXT_PUBLIC_API_URL=https://YOUR-API.onrender.com` (no trailing slash)
   - `NEXT_PUBLIC_BACKEND_URL` same as above (optional)
   - `JWT_SECRET`, `DATABASE_URL`, WebAuthn vars as needed
3. Redeploy. Open `/pest-demo` → Camera/Upload → **Diagnose**.

The Diagnose page posts **directly** to the Render API (avoids Vercel serverless timeouts).

### ESP32-CAM (extra camera on your existing sensor kit)
- Flash `hardware/esp32_cam_diagnose/esp32_cam_diagnose.ino` (AI Thinker).
- It POSTs stills to `/api/pest/device-scan`; sensors stay on MQTT.
- Dashboard → Operations shows **ESP32-CAM last scan**.
- Set `DATABASE_URL` on Render so scans are stored; optional `DEVICE_UPLOAD_KEY`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **WhatsApp**: +91 76709 97498
- **Email**: support@smartagritech.com
- **Documentation**: http://localhost:8000/docs

---

Built with ❤️ for farmers worldwide 🌱
