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

/** Fetch pollen forecast for a location (max 5 days; API does not provide past data) */
async function getPollenForecast(lat, lon) {
  if (!GOOGLE_POLLEN_KEY) return { error: 'Pollen API key not configured' };
  const url = `https://pollen.googleapis.com/v1/forecast:lookup?location.latitude=${lat}&location.longitude=${lon}&days=5&key=${GOOGLE_POLLEN_KEY}`;
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

/** Escape unescaped newlines inside JSON string values to fix "Unterminated string" errors */
function tryFixJsonString(str) {
  if (typeof str !== 'string') return str;
  let inString = false;
  let escape = false;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escape) {
      result += c;
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      result += c;
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      result += c;
      continue;
    }
    if (inString && (c === '\n' || c === '\r')) {
      result += c === '\n' ? '\\n' : '\\r';
      continue;
    }
    result += c;
  }
  return result;
}

/** Fallback: extract known fields with regex when JSON.parse fails */
function extractJsonFields(str) {
  const num = (re) => {
    const m = str.match(re);
    return m ? parseInt(m[1], 10) : 0;
  };
  const strField = (re) => {
    const m = str.match(re);
    return m ? m[1].replace(/\\"/g, '"').trim() : undefined;
  };
  const symptomsMatch = str.match(/"symptoms"\s*:\s*\[([\s\S]*?)\]/);
  let symptoms = [];
  if (symptomsMatch) {
    const inner = symptomsMatch[1];
    const items = inner.match(/"([^"]*)"/g) || [];
    symptoms = items.map((s) => s.slice(1, -1).replace(/\\"/g, '"'));
  }
  return {
    sicknessProbability: num(/"sicknessProbability"\s*:\s*(\d+)/),
    symptoms,
    eyeAnalysis: strField(/"eyeAnalysis"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    environmentalFactors: strField(/"environmentalFactors"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    recommendations: strField(/"recommendations"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    severity: strField(/"severity"\s*:\s*"([^"]*)"/) || 'unknown',
    shouldSeeDoctor: /"shouldSeeDoctor"\s*:\s*true/.test(str),
  };
}

/** Call Gemini with image + text (+ optional voice) and return structured health assessment */
async function analyzeWithGemini({
  imageBase64,
  imageMediaType,
  pollenSummary,
  lat,
  lon,
  voiceBase64,
  voiceMimeType,
}) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const rawBase64 = toRawBase64(imageBase64);

  const voiceInstruction = voiceBase64
    ? `The user read a standard English sentence aloud. Analyze their **voice** for signs of illness: congestion, nasal quality, hoarseness, raspiness, weakness, fatigue, or other qualities that may indicate they are unwell. Use this together with the eye photo.`
    : 'No voice recording provided.';

  const text = `You are a **sickness** assessment AI. Assess only whether the user might be unwell (infection, allergy, fatigue, congestion). Do **not** comment on skin blemishes, acne, cosmetic issues, or any non-illness appearance.

1. **Eye photo**: Look **only** for signs of illness: redness or swelling suggesting infection or allergy, discharge, or signs of fatigue. Ignore and do not mention skin blemishes, dark circles as cosmetic, or other non-illness features. If you mention the eyes/face, restrict it to illness-relevant findings only.
2. **Location**: ${lat}, ${lon}
3. **Pollen / past days**: The data below is **only a forecast** (today and upcoming days). We have **no data for the past**. You **must** consider the **past 2–4 days**: allergy symptoms often appear 1–4 days after exposure, so the user may be feeling lingering effects from recent pollen even if the forecast is low. **Do not** conclude that "pollen is unlikely to contribute" or "environmental pollen is highly unlikely" solely because the forecast shows low levels. Instead, state that recent exposure is unknown and that past 2–4 day exposure could still explain allergy-like symptoms if present. When the forecast is low, say something like: "Current forecast is low; recent days are unknown—past 2–4 day exposure could still contribute to allergy-like symptoms."
${pollenSummary}
4. **Voice**: ${voiceInstruction}

Respond with a single JSON object only, no markdown or extra text. In eyeAnalysis and symptoms, include only illness-related findings (no skin blemishes or cosmetic comments).
{
  "sicknessProbability": <0-100>,
  "symptoms": ["illness-related symptom only"],
  "eyeAnalysis": "illness-relevant findings only, no blemishes/cosmetic",
  "environmentalFactors": "include note on past 2-4 day pollen uncertainty when forecast is low",
  "recommendations": "practical advice",
  "severity": "none|mild|moderate|severe",
  "shouldSeeDoctor": true or false
}`;

  const parts = [
    {
      inline_data: {
        mime_type: imageMediaType || 'image/jpeg',
        data: rawBase64,
      },
    },
  ];
  // Cap audio size to avoid huge payloads and timeouts (~2.5MB base64 ≈ 30–60s of m4a)
  const MAX_VOICE_BASE64_LENGTH = 2_600_000;
  if (voiceBase64 && voiceBase64.length > MAX_VOICE_BASE64_LENGTH) {
    voiceBase64 = voiceBase64.slice(0, MAX_VOICE_BASE64_LENGTH);
  }
  if (voiceBase64) {
    parts.push({
      inline_data: {
        mime_type: voiceMimeType || 'audio/m4a',
        data: voiceBase64,
      },
    });
  }
  parts.push({ text });

  const controller = new AbortController();
  const timeoutMs = 90_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            max_output_tokens: 2048,
            response_mime_type: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    );
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === 'AbortError') {
      throw new Error('Analysis timed out. Try a shorter recording or try again.');
    }
    throw fetchErr;
  }
  clearTimeout(timeoutId);

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
  const jsonStr = jsonMatch ? jsonMatch[0] : raw;

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    // Gemini sometimes returns truncated or invalid JSON (unescaped newlines in strings)
    const fixed = tryFixJsonString(jsonStr);
    try {
      parsed = JSON.parse(fixed);
    } catch {
      parsed = extractJsonFields(jsonStr);
    }
  }

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

/** POST /analyze — form: imageBase64, imageMediaType, latitude, longitude, optional voiceBase64 + voiceMediaType */
const parseAnalyze = multer({
  storage: multer.memoryStorage(),
  limits: { fieldSize: 20 * 1024 * 1024 }, // 20MB per field (image + voice base64)
}).none();
app.post('/analyze', parseAnalyze, async (req, res) => {
  try {
    const imageBase64 = req.body?.imageBase64;
    const imageMediaType = (req.body?.imageMediaType || 'image/jpeg').trim();
    const lat = parseFloat(req.body?.latitude);
    const lon = parseFloat(req.body?.longitude);
    const voiceBase64 = req.body?.voiceBase64 || null;
    const voiceMimeType = (req.body?.voiceMediaType || 'audio/m4a').trim();

    console.log('[/analyze] Request received', {
      bodyKeys: Object.keys(req.body || {}),
      hasVoice: Boolean(voiceBase64),
      voiceLen: voiceBase64?.length ?? 0,
    });

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

    console.log('[/analyze] Calling Gemini (with voice:', !!voiceBase64, ')');
    const result = await analyzeWithGemini({
      imageBase64,
      imageMediaType,
      pollenSummary,
      lat,
      lon,
      voiceBase64,
      voiceMimeType,
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
