# PollenCast — Health Check App

Mobile and web app (Expo) that uses a **photo of your eyes**, optional **voice recording**, and **location** to get a simple health assessment. A Node backend sends the image and context to **Gemini** and optional **Google Pollen API**; auth is handled by **Supabase**.

**Live app (Vercel):** [https://pollen-cast.vercel.app](https://pollen-cast.vercel.app)

---

## Run locally

You need **two terminals**: one for the backend, one for the app.

### 1. Clone and install

```bash
git clone <repo-url>
cd hackeurope
npm install
cd backend && npm install && cd ..
```

### 2. Environment variables

**Root `.env`** (for the Expo app):

```bash
cp .env.example .env
```

Edit `.env` and set:

- `EXPO_PUBLIC_API_URL=http://localhost:3001` (use your machine’s IP if testing on a physical device on the same WiFi)
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from [Supabase](https://app.supabase.com) → your project → Settings → API

**Backend `backend/.env`** (for the API):

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set at least:

- `GEMINI_API_KEY` — [Get a key](https://ai.google.dev/)
- `GOOGLE_POLLEN_API_KEY` — optional, for pollen/environmental data

See `backend/.env.example` for all options.

### 3. Start backend and app

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

Runs at `http://localhost:3001`.

**Terminal 2 — App:**

```bash
npm start
```

Then press **`w`** for web, or scan the QR code with Expo Go on your phone.  
If you use a physical device, set `EXPO_PUBLIC_API_URL` in the root `.env` to your computer’s IP (e.g. `http://192.168.1.5:3001`) and restart Expo.

---

## Prerequisites

- **Node.js** 18+
- **npm**
- **Python 3.8+** (for the voice analysis service)
- **Expo Go** on your device, or Android/iOS simulator

---

## Other ways to run locally

- **Backend + voice service in one go:** run `./start-dev.sh`, then in a second terminal run `npm start`. Stop with `./stop-dev.sh`.
- **Voice service only** (optional): `cd backend/voice-service && python main.py` — runs at `http://localhost:3002`.

<details>
<summary>Legacy setup (clone + env only)</summary>

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

</details>

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

---

## Deploy to Vercel

**Live demo:** [pollen-cast.vercel.app](https://pollen-cast.vercel.app)

You can host **both the web app and the API** on one Vercel project. The voice service (Python/librosa) must be hosted separately (e.g. Railway, Render, Fly.io).

### 1. Install the Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy from the repo root (web app + API)

**Important:** Run `vercel` from the **project root** (where `vercel.json` and `package.json` are), not from `backend/`. That way you get:

- The **Expo web app** at `https://your-project.vercel.app`
- The **API** at the same domain: `/health`, `/analyze`, `/pollen`, `/environmental`

```bash
cd hackeurope   # or your repo root
vercel
```

Follow the prompts (link to your Vercel account/team, confirm settings). Vercel will run `npm run build` (Expo web export) and set up the serverless function for the API.

### 3. Set environment variables

In the Vercel dashboard (Settings > Environment Variables), or via CLI from the repo root:

```bash
vercel env add GEMINI_API_KEY              # required for /analyze
vercel env add EXPO_PUBLIC_API_URL         # set to your deployment URL, e.g. https://your-project.vercel.app
vercel env add GOOGLE_POLLEN_API_KEY       # optional, for pollen data
vercel env add VOICE_SERVICE_URL           # optional, URL of your hosted voice service
```

Set `EXPO_PUBLIC_API_URL` to your Vercel deployment URL (e.g. `https://your-project.vercel.app`) so the built web and mobile app call the right API.

Redeploy so the new variables are used:

```bash
vercel --prod
```

### 4. Use the deployed site

- **Web:** Open `https://your-project.vercel.app` in a browser. The app will call the same origin for the API, so no extra config is needed.
- **Mobile (Expo Go):** In the project root `.env` set `EXPO_PUBLIC_API_URL=https://your-project.vercel.app` so the app can reach the API. Restart Expo after changing `.env`.

### 5. Voice service (separate host)

The Python voice service cannot run on Vercel (heavy dependencies, long-running process). Deploy it to any container-friendly platform:

```bash
cd backend/voice-service
# e.g. Railway
railway init && railway up

# or Docker anywhere
docker build -t voice-service .
docker run -p 3002:3002 voice-service
```

Then set `VOICE_SERVICE_URL` in Vercel env vars to the deployed URL (e.g. `https://voice-service-xxx.up.railway.app`).

### Limitations on Vercel

| Constraint | Hobby (free) | Pro ($20/mo) |
|---|---|---|
| Function timeout | 10 s | 60 s |
| Request body size | 4.5 MB | 4.5 MB |
| Memory | 1024 MB | 1024 MB |

- **Timeout:** `/analyze` (Gemini + pollen + geocoding) typically takes 10–30 s. Hobby plan will frequently time out; **Pro is recommended**.
- **Body size:** Base64-encoded images are ~33% larger than the original file. A 3 MB photo becomes ~4 MB base64. Keep photos under ~3 MB, or compress before sending, to stay within the 4.5 MB limit.
- **Cold starts:** First request after idle may be a few seconds slower.
- **Voice:** Must be hosted externally (see above).
