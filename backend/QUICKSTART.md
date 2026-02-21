# Backend quick reference

**Full setup and run instructions:** see the [root README](../README.md).

## Run

```bash
cd backend
npm install   # once
npm run dev  # or npm start
```

Server: `http://localhost:3001`. Set `backend/.env` from `backend/.env.example` (at least `GEMINI_API_KEY`).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{"ok": true}` |
| GET | `/pollen?lat=&lon=` | Pollen / environmental (needs `GOOGLE_POLLEN_API_KEY`) |
| GET | `/environmental?lat=&lon=` | Same as pollen, different name |
| POST | `/analyze` | Eye + optional voice analysis (Gemini). Body: `imageBase64`, `imageMediaType`, `latitude`, `longitude`; optional `voiceBase64`, `voiceMediaType`, `allergyHistory`. |

## Tests

- **Model evaluation:** `npm run evaluate-model` (backend must be running). See [scripts/README.md](scripts/README.md).
- **Pollen (manual):** With server running, `node test-pollen.js`.

## Docs

- `GOOGLE_POLLEN_API.md` — Pollen API details.
