# Quick Start Guide

## ✅ Current Status

- **Server**: Express on port 3001
- **Health**: `GET /health` ✅
- **Pollen**: Google Pollen API via `GET /pollen` and `GET /environmental` (requires `GOOGLE_POLLEN_API_KEY`)
- **Analysis**: `POST /analyze` — JSON body, Gemini 2.5 Flash Lite

## 🚀 Running the Server

```bash
cd backend
npm install   # only once
npm run dev  # or: npm start
```

Server: `http://localhost:3001`

## 🧪 Testing

### 1. Health check
```bash
curl http://localhost:3001/health
# {"ok":true}
```

### 2. Pollen / environmental data
```bash
curl "http://localhost:3001/pollen?lat=37.7749&lon=-122.4194"
# or
curl "http://localhost:3001/environmental?lat=37.7749&lon=-122.4194"
```
Requires `GOOGLE_POLLEN_API_KEY` in `backend/.env`. Response shape: see `GOOGLE_POLLEN_API.md`.

### 3. Full analysis (JSON body)
```bash
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"<base64-string>","imageMediaType":"image/jpeg","latitude":37.7749,"longitude":-122.4194}'
```
Optional: add `"voiceBase64":"<base64>","voiceMediaType":"audio/m4a"` for voice. Requires `GEMINI_API_KEY` in `backend/.env`.

## 🌐 API

### GET `/health`
Returns `{"ok": true}`.

### GET `/pollen?lat=X&lon=Y` and GET `/environmental?lat=X&lon=Y`
Google Pollen API data for the location. Params: `lat`, `lon` (e.g. 37.7749, -122.4194).

### POST `/analyze`
**Body (JSON):**
- `imageBase64` (string) — required
- `imageMediaType` (string) — e.g. `"image/jpeg"`
- `latitude` (number) — required
- `longitude` (number) — required
- `voiceBase64` (string) — optional
- `voiceMediaType` (string) — optional, e.g. `"audio/m4a"`

**Response:** JSON with `sicknessProbability`, `allergyProbability`, `symptoms`, `eyeAnalysis`, `environmentalFactors`, `recommendations`, `severity`, `shouldSeeDoctor`, `isUnilateral`, `dischargeType`, plus `environmental`, `voice`, `location`, `timestamp`.

## 🔧 Configuration

In `backend/.env`:

```bash
GEMINI_API_KEY=your_gemini_key      # required for /analyze
GOOGLE_POLLEN_API_KEY=your_key      # optional; pollen data disabled if missing
VOICE_SERVICE_URL=http://localhost:3002   # optional; Python voice service for nasality
PORT=3001
```

## 📚 Docs

- `GOOGLE_POLLEN_API.md` — Pollen API details
- `demo-response.json` — Legacy Open-Meteo example (current API uses Google Pollen)
