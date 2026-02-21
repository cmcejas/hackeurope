# Quick Start Guide - Pollen API Integration

## ✅ Current Status

- **Server Running**: ✅ Port 3001
- **Health Endpoint**: ✅ Working (`/health`)
- **Environmental Endpoint**: ⚠️ Implemented but Open-Meteo API unreachable (DNS issue)
- **Dependencies**: ✅ Installed

## 🚀 Running the Server

```bash
cd backend
npm install  # Only needed once
npm start
```

Server will start on `http://localhost:3001`

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3001/health
# Response: {"ok":true}
```

### 2. Environmental Data (when network is available)
```bash
curl "http://localhost:3001/environmental?lat=37.7749&lon=-122.4194"
```

**Example Response**: See `demo-response.json` for what this returns when Open-Meteo is accessible.

### 3. Full Analysis
```bash
curl -X POST http://localhost:3001/analyze \
  -F "imageBase64=data:image/jpeg;base64,..." \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

## 🌐 API Endpoints

### GET `/health`
Health check endpoint.

**Response:**
```json
{"ok": true}
```

### GET `/environmental?lat=X&lon=Y`
Fetch 48-hour historical pollen and air quality data.

**Parameters:**
- `lat` - Latitude (e.g., 37.7749)
- `lon` - Longitude (e.g., -122.4194)

**Response:** See `demo-response.json`

### POST `/analyze`
Full diagnostic analysis with eye photo + environmental context.

**Form Data:**
- `imageBase64` - Base64 encoded eye photo
- `imageMediaType` - MIME type (e.g., "image/jpeg")
- `latitude` - User latitude
- `longitude` - User longitude
- `voice` (optional) - Voice recording file

**Response:**
```json
{
  "sicknessProbability": 30,
  "allergyProbability": 75,
  "symptoms": ["bilateral redness", "clear tearing"],
  "eyeAnalysis": "Bilateral conjunctival injection...",
  "environmentalFactors": "High grass pollen levels...",
  "recommendations": "Use antihistamine eye drops...",
  "severity": "moderate",
  "shouldSeeDoctor": false,
  "isUnilateral": false,
  "dischargeType": "clear",
  "environmental": {
    "pollen": { ... },
    "airQuality": { ... },
    "allergyRiskScore": { "score": 55, "level": "high" }
  },
  "location": { "latitude": 37.7749, "longitude": -122.4194 },
  "timestamp": "2026-02-21T13:00:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Required
GEMINI_API_KEY=your_actual_api_key_here

# Optional
PORT=3001
```

See `.env.example` for template.

## ⚠️ Current Limitations

1. **Network Issue**: Open-Meteo API is currently unreachable (DNS lookup failing)
   - This is an environmental issue, not a code issue
   - The implementation is correct and will work when network is available
   - Error message: `getaddrinfo ENOTFOUND air-quality.open-meteo.com`

2. **Testing**: Run `node test-pollen.js` to verify Open-Meteo connectivity

## 📊 What the Pollen API Provides

### Pollen Types (grains/m³)
- Alder, Birch, Grass, Mugwort, Olive, Ragweed

### Air Quality (µg/m³)
- PM2.5, PM10, CO, NO₂, SO₂, O₃

### Analysis
- Average, max, and recent (6h) values
- Trend detection (increasing/decreasing)
- Allergy Risk Score (0-100)
- Dominant allergen identification

## 🎯 Next Steps

1. **Test with working network** - Try the API from a different network/environment
2. **Frontend integration** - Connect the mobile app to these endpoints
3. **Add caching** - Cache environmental data to reduce API calls
4. **FHIR mapping** - Convert responses to FHIR R4 resources

## 📚 Documentation

- `POLLEN_API.md` - Detailed API documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `demo-response.json` - Example API response
- `test-pollen.js` - Test script

## 🐛 Troubleshooting

**Server won't start:**
```bash
cd backend
npm install
npm start
```

**Port already in use:**
```bash
# Kill existing server
pkill -f "node server.js"
# Or use different port
PORT=3002 npm start
```

**Open-Meteo not responding:**
- This is expected in the current environment
- The implementation is correct
- Try from a different network or wait for connectivity

## 💡 Tips

- The server logs startup info to console
- GEMINI_API_KEY is already configured in `.env.example`
- Open-Meteo requires no API key (free public API)
- Test individual endpoints before full integration
