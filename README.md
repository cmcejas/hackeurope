# HackEurope — Health Check App

Mobile app (Expo) that uses a **photo of your eyes**, optional **voice recording**, and **location** to get a simple health assessment. A Node backend sends the image and context to **Gemini** and optional **Google Pollen API**, and an optional Python **voice service** analyzes the recording for nasality.

---

## Prerequisites

- **Node.js** 18+
- **npm**
- **Python 3.8+** (for the voice analysis service)
- **Expo Go** on your device, or Android/iOS simulator

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd hackeurope

# App
npm install

# Backend
cd backend && npm install && cd ..
```

### 2. Environment variables

**App (project root)**  
Copy and edit if you need a custom API URL (e.g. for a physical device on the same WiFi):

```bash
cp .env.example .env
# Optional: set EXPO_PUBLIC_API_URL=http://YOUR_IP:3001
```

**Backend**  
Required for the analysis endpoint:

```bash
cd backend
cp .env.example .env
# Edit .env: set GEMINI_API_KEY (get one at https://ai.google.dev/)
# Optional: GOOGLE_POLLEN_API_KEY for pollen/environmental data
cd ..
```

See `backend/.env.example` for all optional keys.

---

## How to run the project

### Option A — One-command start (recommended)

Starts the voice service and backend; you then start the app in another terminal.

```bash
./start-dev.sh
```

In a **second terminal**:

```bash
npm start
# Then press 'a' (Android), 'i' (iOS), or 'w' (web)
```

**Stop services:**

```bash
./stop-dev.sh
```

### Option B — Manual (three terminals)

1. **Voice service** (optional; for voice analysis):

   ```bash
   cd backend/voice-service
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python main.py
   ```

   Runs at `http://localhost:3002`.

2. **Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   Runs at `http://localhost:3001`.

3. **App:**

   ```bash
   npm start
   ```

   Use the Expo CLI to open on device or simulator.

**Using a physical device:** Set `EXPO_PUBLIC_API_URL` in the root `.env` to your computer’s IP (e.g. `http://192.168.1.5:3001`). Find your IP with `ip addr` (Linux) or `ipconfig` (Windows). Restart Expo after changing `.env`.

---

## How to run the tests

### 1. Model evaluation (Gemini behavior)

Feeds the backend different symptom prompts and checks that the model’s answers match expected criteria (probability ranges, `shouldSeeDoctor`, etc.). Measures how often the model is “correct” on the defined cases.

**Prerequisites:** Backend must be running (`cd backend && npm run dev`).

```bash
cd backend
npm run evaluate-model
```

- Test cases: `backend/scripts/model-test-cases.js`
- Runner: `backend/scripts/evaluate-model.js`
- Optional: set `TEST_IMAGE_BASE64` to a base64 eye image for more realistic runs.

See `backend/scripts/README.md` for adding or changing cases.

### 2. Voice service test

Generates synthetic audio and calls the voice service’s `/health` and `/analyze` endpoints.

**Prerequisites:** Voice service running (`cd backend/voice-service && python main.py`).

```bash
cd backend/voice-service
source venv/bin/activate
pip install -r test_requirements.txt   # if not already installed
python test_voice_service.py
```

### 3. Backend health check

With the backend running:

```bash
curl http://localhost:3001/health
# Expect: {"ok":true}
```

---

## Project layout

| Path | Description |
|------|-------------|
| `app/` | Expo Router app (tabs, camera, recording, results) |
| `lib/` | API client, config, types |
| `backend/` | Node API (Express): `/health`, `/analyze`, pollen, geocoding |
| `backend/voice-service/` | Python voice analysis (librosa), optional |
| `backend/scripts/` | Model evaluation: test cases + runner |
| `start-dev.sh` / `stop-dev.sh` | Start/stop backend + voice service |

---

## API overview

- **GET** `http://localhost:3001/health` — Liveness.
- **POST** `http://localhost:3001/analyze` — Body: `imageBase64`, `imageMediaType`, `latitude`, `longitude`; optional: `voiceBase64`, `voiceMediaType`, `allergyHistory`. Returns assessment (e.g. `sicknessProbability`, `shouldSeeDoctor`, `recommendations`).

More detail: `backend/QUICKSTART.md`, `backend/voice-service/README.md`.
