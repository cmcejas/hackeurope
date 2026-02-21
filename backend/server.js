import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_POLLEN_KEY = process.env.GOOGLE_POLLEN_API_KEY;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

/** Fetch pollen forecast for a location */
async function getPollenForecast(lat, lon) {
  if (!GOOGLE_POLLEN_KEY) return { error: 'Pollen API key not configured' };
  const url = `https://pollen.googleapis.com/v1/forecast:lookup?location.latitude=${lat}&location.longitude=${lon}&days=2&key=${GOOGLE_POLLEN_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { error: `Pollen API: ${res.status}` };
    return await res.json();
  } catch (e) {
    return { error: String(e.message) };
  }
}

/** Strip data URL prefix if present; Gemini expects raw base64 only */
function toRawBase64(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^data:[\w/+-]+;base64,(.+)$/);
  return match ? match[1].trim() : value.trim();
}

/** Call Gemini with image + text and return structured health assessment */
async function analyzeWithGemini({ imageBase64, imageMediaType, pollenSummary, lat, lon, hasVoice }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const rawBase64 = toRawBase64(imageBase64);

  const text = `You are a health assessment AI. Analyze the provided data:

1. **Eye photo**: This image shows the user's eyes. Look for signs of illness, allergy, or fatigue (redness, swelling, discharge, dark circles).
2. **Location**: ${lat}, ${lon}
3. **Pollen / environment**: ${pollenSummary}
4. **Voice**: ${hasVoice ? 'The user also submitted a voice recording describing how they feel (audio not sent; consider general symptom context).' : 'No voice recording provided.'}

Respond with a single JSON object only, no markdown or extra text:
{
  "sicknessProbability": <0-100>,
  "symptoms": ["symptom1", "symptom2"],
  "eyeAnalysis": "brief description",
  "environmentalFactors": "e.g. pollen level summary",
  "recommendations": "practical advice",
  "severity": "none|mild|moderate|severe",
  "shouldSeeDoctor": true or false
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: imageMediaType || 'image/jpeg',
                  data: rawBase64,
                },
              },
              { text },
            ],
          },
        ],
        generationConfig: {
          max_output_tokens: 1024,
          response_mime_type: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const raw =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ||
    '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

  return {
    sicknessProbability: Number(parsed.sicknessProbability) || 0,
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    eyeAnalysis: parsed.eyeAnalysis,
    environmentalFactors: parsed.environmentalFactors,
    recommendations: parsed.recommendations,
    severity: parsed.severity || 'unknown',
    shouldSeeDoctor: Boolean(parsed.shouldSeeDoctor),
  };
}

/** POST /analyze — multipart: imageBase64, imageMediaType, latitude, longitude, optional voice file */
app.post('/analyze', upload.single('voice'), async (req, res) => {
  try {
    const imageBase64 = req.body?.imageBase64;
    const imageMediaType = (req.body?.imageMediaType || 'image/jpeg').trim();
    const lat = parseFloat(req.body?.latitude);
    const lon = parseFloat(req.body?.longitude);
    const hasVoice = Boolean(req.file);

    if (!imageBase64 || Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: 'Missing required fields: imageBase64, latitude, longitude',
      });
    }

    const pollen = await getPollenForecast(lat, lon);
    const pollenSummary =
      pollen.error ?
        `Error: ${pollen.error}`
      : JSON.stringify(pollen, null, 2);

    const result = await analyzeWithGemini({
      imageBase64,
      imageMediaType,
      pollenSummary,
      lat,
      lon,
      hasVoice,
    });

    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({
      error: err.message || 'Analysis failed',
    });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`On a device? Use your computer IP, e.g. http://<YOUR_IP>:${PORT}`);
  if (!GEMINI_API_KEY) console.warn('GEMINI_API_KEY not set — analysis will fail');
  if (!GOOGLE_POLLEN_KEY) console.warn('GOOGLE_POLLEN_API_KEY not set — pollen data disabled');
});
