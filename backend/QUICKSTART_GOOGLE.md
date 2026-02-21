# Quick Start Guide - Google Pollen API Integration

## ✅ Current Status

- **Server Running**: ✅ Port 3001
- **Health Endpoint**: ✅ Working (`/health`)
- **Pollen Endpoint**: ✅ Working with Google Pollen API (`/pollen`)
- **Google Pollen API**: ✅ Connected and returning data
- **Dependencies**: ✅ Installed

## 🚀 Running the Server

```bash
cd backend

# First time setup
npm install
cp .env.example .env
# Edit .env and add your GOOGLE_POLLEN_API_KEY

# Start server
npm start
```

Server starts on `http://localhost:3001`

**Console output:**
```
Backend running at http://localhost:3001
On a device? Use your computer IP, e.g. http://<YOUR_IP>:3001
Using Google Pollen API for pollen forecast data
```

## 🔑 Getting Your API Key

1. Go to [Google Cloud Console - Pollen API](https://console.cloud.google.com/apis/library/pollen.googleapis.com)
2. Click "Enable API"
3. Navigate to [Credentials](https://console.cloud.google.com/apis/credentials)
4. Click "Create Credentials" → "API Key"
5. Copy the key to your `.env` file

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3001/health
# Response: {"ok":true}
```

### 2. Pollen Data (San Francisco)
```bash
curl "http://localhost:3001/pollen?lat=37.7749&lon=-122.4194"
```

**Example Response:**
```json
{
  "source": "Google Pollen API",
  "period": "5 days",
  "location": {"latitude": 37.7749, "longitude": -122.4194},
  "regionCode": "US",
  "pollen": {
    "level": "low",
    "maxIndex": 1,
    "types": {
      "tree": {"currentLevel": "NONE", "forecast": ["NONE", "NONE", "Very Low", ...]},
      "grass": {"currentLevel": "NONE", "forecast": [...]},
      "weed": {"currentLevel": "NONE", "forecast": [...]}
    },
    "plantsInSeason": []
  },
  "allergyRiskScore": {"score": 20, "level": "moderate"}
}
```

### 3. Test Different Locations
```bash
# New York
curl "http://localhost:3001/pollen?lat=40.7128&lon=-74.0060"

# Los Angeles
curl "http://localhost:3001/pollen?lat=34.0522&lon=-118.2437"

# London
curl "http://localhost:3001/pollen?lat=51.5074&lon=-0.1278"
```

### 4. Full Analysis Endpoint
```bash
curl -X POST http://localhost:3001/analyze \
  -F "imageBase64=data:image/jpeg;base64,/9j/4AAQSkZJRg..." \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

## 🌐 API Endpoints

### GET `/health`
Health check endpoint.

**Response:** `{"ok": true}`

### GET `/pollen?lat=X&lon=Y`
Fetch pollen forecast data from Google Pollen API.

**Parameters:**
- `lat` - Latitude (e.g., 37.7749)
- `lon` - Longitude (e.g., -122.4194)

**Response:** Pollen data with 5-day forecast

### GET `/environmental?lat=X&lon=Y`
Legacy endpoint - same as `/pollen` (for backwards compatibility)

### POST `/analyze`
Full diagnostic analysis with eye photo + pollen context.

**Form Data:**
- `imageBase64` - Base64 encoded eye photo (with or without data URI prefix)
- `imageMediaType` - MIME type (default: "image/jpeg")
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
  "environmentalFactors": "Tree pollen levels are high (Oak 4.2/5)...",
  "recommendations": "Use antihistamine eye drops...",
  "severity": "moderate",
  "shouldSeeDoctor": false,
  "isUnilateral": false,
  "dischargeType": "clear",
  "environmental": {
    "source": "Google Pollen API",
    "pollen": {
      "level": "high",
      "types": {...},
      "plantsInSeason": [...]
    }
  },
  "timestamp": "2026-02-21T13:00:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Required - Gemini Vision API
GEMINI_API_KEY=your_gemini_api_key

# Required - Google Pollen API
GOOGLE_POLLEN_API_KEY=your_google_pollen_api_key

# Optional
PORT=3001
```

See `.env.example` for template.

## 📊 Understanding Pollen Levels

### Universal Pollen Index (UPI)
- **0-1**: None
- **1-2**: Very Low / Low
- **2-3**: Moderate
- **3-4**: High
- **4-5**: Very High

### Pollen Types
- **Tree**: Oak, Birch, Maple (peak: Spring)
- **Grass**: Common grasses (peak: Summer)
- **Weed**: Ragweed, Mugwort (peak: Fall)

### When to Expect High Pollen

| Season | Tree | Grass | Weed |
|--------|------|-------|------|
| Winter | Low | None | None |
| Spring | **HIGH** | Moderate | Low |
| Summer | Low | **HIGH** | Moderate |
| Fall | Low | Low | **HIGH** |

## ⚠️ Current Limitations

1. **Air Quality Data**: Google Pollen API doesn't provide air quality metrics
   - Only pollen-based risk scoring
   - For air quality, consider adding a separate API

2. **Forecast vs Historical**: Google provides forecasts (next 5 days)
   - No historical pollen data available
   - Good for prevention, less useful for post-symptom diagnosis

3. **Plant Seasonality**: Specific plant data only available when plants are "in season"
   - Winter months may show empty `plantsInSeason` array

## 🐛 Troubleshooting

**"Pollen API key not configured":**
```bash
# Check .env file exists
ls -la backend/.env

# If not, create it
cd backend
cp .env.example .env

# Edit .env and add your API key
# Then restart server
npm start
```

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

**API key errors:**
- Verify the API is enabled in [Google Cloud Console](https://console.cloud.google.com/apis/library/pollen.googleapis.com)
- Check billing is enabled (required even for free tier)
- Verify API key restrictions aren't blocking requests

## 💡 Tips

- Google Pollen API has generous free tier
- Cache responses to reduce API costs (pollen doesn't change every second)
- Higher pollen = stronger correlation with allergy symptoms
- Test during Spring (Mar-May) for most interesting tree pollen data
- `plantsInSeason` array shows specific culprits (e.g., "Oak", "Ragweed")

## 📚 Documentation

- `GOOGLE_POLLEN_API.md` - Detailed API documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `.env.example` - Environment template

## 🎯 Next Steps

1. **Test with real eye photos** - Use the `/analyze` endpoint
2. **Frontend integration** - Connect mobile app to backend
3. **Add caching** - Implement Redis for pollen data
4. **Symptom tracking** - Log which plants trigger symptoms
5. **FHIR mapping** - Convert to FHIR R4 resources
