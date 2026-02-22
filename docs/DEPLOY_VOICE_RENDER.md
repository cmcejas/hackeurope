# Deploy the voice analysis service to Render

This gets the Python voice service (used for nasality analysis) running on Render so your Vercel app can use it in production.

## 1. Push your repo

Make sure your code is on GitHub (with `backend/voice-service/`, `render.yaml`, and the Dockerfile).

## 2. Create the service on Render

1. Go to **[dashboard.render.com](https://dashboard.render.com)** and sign in (GitHub is fine).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub account if needed, then select the **hackeurope** repo.
4. Render will read `render.yaml` and show a service named **pollencast-voice**. Click **Apply**.
5. Wait for the first deploy to finish (Build → Deploy). It may take a few minutes.

## 3. Get the service URL

1. Open the **pollencast-voice** service in the Render dashboard.
2. At the top you’ll see the URL, e.g. **`https://pollencast-voice.onrender.com`**. Copy it (no trailing slash).

## 4. Connect Vercel to the voice service

1. Go to **[vercel.com](https://vercel.com)** → your **pollen-cast** project.
2. **Settings** → **Environment Variables**.
3. Add:
   - **Name:** `VOICE_SERVICE_URL`
   - **Value:** `https://pollencast-voice.onrender.com` (your actual Render URL)
   - **Environment:** Production (and Preview if you want voice in previews too).
4. Save and **redeploy** the app (Deployments → ⋮ on latest → Redeploy) so the new env var is used.

## Done

After the next deploy, the Vercel backend will call the Render voice service when users submit a recording. The first request after the service has been idle may take 30–60 seconds (Render free tier spin-up); later requests are fast until it sleeps again.

## Troubleshooting

- **Voice still “unavailable”:** Check that `VOICE_SERVICE_URL` in Vercel matches the Render URL exactly (https, no trailing slash). Redeploy after changing env vars.
- **Build fails on Render:** Ensure `backend/voice-service/` has `Dockerfile`, `main.py`, and `requirements.txt`. The Dockerfile installs `ffmpeg` and `libsndfile1`; the build must be able to run `apt-get`.
- **Health check:** Open `https://your-voice-service.onrender.com/health` in a browser; you should see `{"status":"healthy",...}`.
