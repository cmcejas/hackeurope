import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { supabase } from './supabaseClient.js';

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_POLLEN_KEY = process.env.GOOGLE_POLLEN_API_KEY;
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || GOOGLE_POLLEN_KEY;
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('[/] JSON body parse failed:', err.message);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next(err);
});

/* ═══════════════  REVERSE GEOCODING (Google Maps)  ═══════════════ */

/**
 * Reverse geocode lat/lon to a human-readable address using Google Geocoding API.
 * Returns the first result's formatted_address, or null if unavailable.
 */
async function reverseGeocodeWithGoogle(lat, lon) {
  if (!GOOGLE_MAPS_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_KEY}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.results?.[0]?.formatted_address;
    return typeof addr === 'string' ? addr.trim() : null;
  } catch {
    return null;
  }
}

/* ═══════════════  POLLEN  ═══════════════ */

async function getGooglePollenData(lat, lon) {
  if (!GOOGLE_POLLEN_KEY) {
    return { error: 'Google Pollen API key not configured' };
  }
  const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_POLLEN_KEY}&location.latitude=${lat}&location.longitude=${lon}&days=5`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errorText = await res.text();
      return { error: `Google Pollen API: ${res.status} - ${errorText}` };
    }
    const data = await res.json();
    return analyzeGooglePollenData(data, lat, lon);
  } catch (e) {
    return { error: String(e.message) };
  }
}

function analyzeGooglePollenData(data, lat, lon) {
  if (!data.dailyInfo || data.dailyInfo.length === 0) {
    return { error: 'No pollen data available for this location' };
  }
  const dailyInfo = data.dailyInfo;

  const pollenTypes = {
    tree: { name: 'Tree', values: [], index: [] },
    grass: { name: 'Grass', values: [], index: [] },
    weed: { name: 'Weed', values: [], index: [] },
  };

  const indexToLevel = (index) => {
    if (index == null || index < 1) return 'none';
    if (index < 2) return 'low';
    if (index < 3) return 'moderate';
    if (index < 4) return 'high';
    return 'very_high';
  };

  const indexToScore = (index) => {
    if (index == null || index < 1) return 0;
    if (index < 2) return 10;
    if (index < 3) return 25;
    if (index < 4) return 40;
    return 50;
  };

  let maxPollenIndex = 0;
  let dominantTypes = [];

  dailyInfo.forEach((day) => {
    if (day.pollenTypeInfo) {
      day.pollenTypeInfo.forEach((typeInfo) => {
        const code = typeInfo.code?.toLowerCase();
        if (code && pollenTypes[code]) {
          const index = typeInfo.indexInfo?.value || 0;
          pollenTypes[code].values.push(typeInfo.indexInfo?.category || 'NONE');
          pollenTypes[code].index.push(index);
          maxPollenIndex = Math.max(maxPollenIndex, index);
          if (index >= 2) {
            dominantTypes.push({
              type: pollenTypes[code].name,
              level: typeInfo.indexInfo?.category || 'UNKNOWN',
              index,
              date: day.date,
            });
          }
        }
      });
    }
  });

  const overallLevel = indexToLevel(maxPollenIndex);

  const plantInfo = [];
  if (dailyInfo[0]?.plantInfo) {
    dailyInfo[0].plantInfo.forEach((plant) => {
      if (plant.inSeason && plant.indexInfo?.value >= 2) {
        plantInfo.push({
          name: plant.displayName || plant.code,
          type: plant.plantDescription?.type || 'unknown',
          level: plant.indexInfo?.category || 'UNKNOWN',
          index: plant.indexInfo?.value || 0,
        });
      }
    });
  }

  dominantTypes.sort((a, b) => b.index - a.index);
  const uniqueDominant = [];
  const seenTypes = new Set();
  dominantTypes.forEach((dt) => {
    if (!seenTypes.has(dt.type)) {
      uniqueDominant.push(dt);
      seenTypes.add(dt.type);
    }
  });

  const pollenScore = indexToScore(maxPollenIndex);
  const allergyRiskScore = calculateGooglePollenRisk(pollenScore);

  return {
    source: 'Google Pollen API',
    period: `${dailyInfo.length} days`,
    location: { latitude: lat, longitude: lon },
    regionCode: data.regionCode || 'unknown',
    pollen: {
      level: overallLevel,
      maxIndex: maxPollenIndex,
      types: {
        tree: { name: 'Tree', currentLevel: pollenTypes.tree.values[0] || 'NONE', maxIndex: pollenTypes.tree.index.length > 0 ? Math.max(...pollenTypes.tree.index) : 0, forecast: pollenTypes.tree.values },
        grass: { name: 'Grass', currentLevel: pollenTypes.grass.values[0] || 'NONE', maxIndex: pollenTypes.grass.index.length > 0 ? Math.max(...pollenTypes.grass.index) : 0, forecast: pollenTypes.grass.values },
        weed: { name: 'Weed', currentLevel: pollenTypes.weed.values[0] || 'NONE', maxIndex: pollenTypes.weed.index.length > 0 ? Math.max(...pollenTypes.weed.index) : 0, forecast: pollenTypes.weed.values },
      },
      dominantTypes: uniqueDominant.slice(0, 3),
      plantsInSeason: plantInfo.slice(0, 5),
    },
    allergyRiskScore,
  };
}

function calculateGooglePollenRisk(pollenScore) {
  const score = pollenScore * 2;
  const level =
    score < 20 ? 'low' :
    score < 40 ? 'moderate' :
    score < 70 ? 'high' : 'very_high';
  return { score, level, note: 'Based on pollen levels only (air quality not available from Google Pollen API)' };
}

/* ═══════════════  VOICE SERVICE  ═══════════════ */

/** Analyze voice via Python librosa microservice. Accepts a Buffer. */
async function analyzeVoice(voiceBuffer, filename = 'recording.m4a', mimeType = 'audio/m4a') {
  if (!voiceBuffer) return null;
  try {
    const formData = new FormData();
    formData.append('audio', voiceBuffer, { filename, contentType: mimeType });
    const response = await fetch(`${VOICE_SERVICE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Voice service error:', response.status, errorText);
      return { error: `Voice analysis failed: ${response.status}`, details: errorText };
    }
    return await response.json();
  } catch (err) {
    console.error('Voice analysis error:', err.message);
    return { error: 'Voice service unavailable', details: err.message };
  }
}

/* ═══════════════  DATABASE  ═══════════════ */

/**
 * Save analysis result to Supabase database
 * Returns the saved record ID or null if save fails/Supabase not configured
 */
async function saveAnalysisToDatabase({ userId, result, lat, lon, allergyHistory }) {
  if (!supabase) {
    console.log('[DB] ⚠️  Supabase not configured, skipping history save');
    return null;
  }

  if (!userId) {
    console.warn('[DB] ⚠️  No userId provided, skipping history save');
    console.warn('[DB] userId received:', userId);
    return null;
  }

  console.log('[DB] 💾 Attempting to save analysis for user:', userId);

  try {
    const insertData = {
      user_id: userId,
      eye_image_url: 'base64://not-stored', // Placeholder since we're not storing images
      voice_recording_url: result.voice ? 'base64://not-stored' : null,
      latitude: lat,
      longitude: lon,
      location_display_name: result.location?.displayName || null,
      pollen_data: result.environmental?.error ? null : result.environmental,
      environmental_summary: result.environmentalFactors || null,
      symptom_description: null,
      allergy_history_snapshot: allergyHistory || null,
      sickness_probability: result.sicknessProbability,
      sickness_reasoning: null,
      allergy_probability: result.allergyProbability || null,
      allergy_reasoning: null,
      severity: result.severity || 'none',
      symptoms: result.symptoms || [],
      eye_analysis: result.eyeAnalysis || null,
      voice_analysis: result.voice || null,
      recommendations: result.recommendations || null,
      should_see_doctor: result.shouldSeeDoctor || false,
      is_unilateral: result.isUnilateral || false,
      discharge_type: result.dischargeType || 'unknown',
      gemini_raw_response: null,
      analysis_version: '2.0'
    };

    console.log('[DB] Insert data prepared, sickness probability:', insertData.sickness_probability);

    const { data, error } = await supabase
      .from('analysis_history')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('[DB] ❌ Failed to save analysis');
      console.error('[DB] Error code:', error.code);
      console.error('[DB] Error message:', error.message);
      console.error('[DB] Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('[DB] ✅ Analysis saved successfully! ID:', data.id);
    return data.id;
  } catch (err) {
    console.error('[DB] ❌ Exception saving analysis:', err.message);
    console.error('[DB] Stack:', err.stack);
    return null;
  }
}

/* ═══════════════  HELPERS  ═══════════════ */

function toRawBase64(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^data:[\w/+-]+;base64,(.+)$/);
  return match ? match[1].trim() : value.trim();
}

function tryFixJsonString(str) {
  let s = str;
  const open = (s.match(/{/g) || []).length;
  const close = (s.match(/}/g) || []).length;
  if (open > close) s += '}'.repeat(open - close);
  s = s.replace(/,\s*([}\]])/g, '$1');
  s = s.replace(/(?<!\\)"\s*\n\s*/g, '" ');
  return s;
}

function extractJsonFields(str) {
  const grab = (key) => {
    const re = new RegExp(`"${key}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|\\d+|true|false|null|\\[[^\\]]*\\])`, 'i');
    const m = str.match(re);
    if (!m) return undefined;
    try { return JSON.parse(m[1]); } catch { return m[1].replace(/^"|"$/g, ''); }
  };
  return {
    sicknessProbability: grab('sicknessProbability'),
    allergyProbability: grab('allergyProbability'),
    symptoms: grab('symptoms'),
    eyeAnalysis: grab('eyeAnalysis'),
    environmentalFactors: grab('environmentalFactors'),
    recommendations: grab('recommendations'),
    severity: grab('severity'),
    shouldSeeDoctor: grab('shouldSeeDoctor'),
    isUnilateral: grab('isUnilateral'),
    dischargeType: grab('dischargeType'),
  };
}

/* ═══════════════  GEMINI  ═══════════════ */

async function analyzeWithGemini({ imageBase64, imageMediaType, environmentalData, lat, lon, voiceAnalysis, allergyHistory }) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const rawBase64 = toRawBase64(imageBase64);

  const envSummary = environmentalData?.error
    ? `Environmental data unavailable: ${environmentalData.error}`
    : `Pollen Level: ${environmentalData.pollen?.level || 'unknown'} (index: ${environmentalData.pollen?.maxIndex || 0}/5)
Pollen Types: Tree=${environmentalData.pollen?.types?.tree?.currentLevel || 'N/A'}, Grass=${environmentalData.pollen?.types?.grass?.currentLevel || 'N/A'}, Weed=${environmentalData.pollen?.types?.weed?.currentLevel || 'N/A'}
Dominant Allergens: ${environmentalData.pollen?.dominantTypes?.map((t) => `${t.type} (${t.level})`).join(', ') || 'none detected'}
Plants in Season: ${environmentalData.pollen?.plantsInSeason?.map((p) => p.name).join(', ') || 'none detected'}
Allergy Risk: ${environmentalData.allergyRiskScore?.level || 'unknown'} (score: ${environmentalData.allergyRiskScore?.score || 0}/100)
Source: Google Pollen API - ${environmentalData.period || 'multi-day'} forecast`;

  let voiceSummary;
  if (!voiceAnalysis) {
    voiceSummary = 'No voice recording provided';
  } else if (voiceAnalysis.error) {
    voiceSummary = `Voice analysis unavailable: ${voiceAnalysis.error}`;
  } else {
    voiceSummary = `Voice Analysis (librosa):
Nasality Score: ${voiceAnalysis.nasality_score}/100 (confidence: ${voiceAnalysis.confidence}%)
Interpretation: ${voiceAnalysis.interpretation}
Suggests Nasal Congestion: ${voiceAnalysis.suggests_congestion ? 'YES - consistent with allergic rhinitis' : 'NO'}
Key Features:
- Spectral Centroid: ${voiceAnalysis.features?.spectral?.spectral_centroid_mean?.toFixed(0) || 'N/A'} Hz
- Low/High Frequency Ratio: ${voiceAnalysis.features?.formant_proxy?.low_to_high_ratio?.toFixed(2) || 'N/A'}
- Duration: ${voiceAnalysis.features?.duration_seconds || 'N/A'} seconds`;
  }

  const text = `You are a medical AI specializing in allergic conjunctivitis and ocular infections. Analyze the provided data:

1. **Eye Photo**: Examine for:
   - Bilateral vs. unilateral redness (unilateral = high-risk, requires urgent care)
   - Presence of clear tearing (suggests allergic) vs. purulent discharge (suggests bacterial/viral)
   - Eyelid swelling, chemosis (conjunctival swelling)
   - Dark circles or periorbital edema

2. **Location**: ${lat}, ${lon}

3. **Environmental Data (48h historical)**:
${envSummary}

4. **Voice Recording Analysis**:
${voiceSummary}

5. **User-provided allergy / symptom history** (if any):
${allergyHistory && allergyHistory.trim() ? allergyHistory.trim() : 'None provided.'}

**IMPORTANT SAFETY RULES**:
- If redness is UNILATERAL (one eye only), set "shouldSeeDoctor": true and flag as urgent
- If purulent discharge is present, recommend immediate medical consultation
- Consider environmental pollen levels when assessing allergy probability
- Focus on sickness indicators only (not skin blemishes, acne, etc.)
- **allergyProbability** must be consistent with sicknessProbability: it is the share of the assessed illness that you attribute to allergy (e.g. allergic conjunctivitis). When sicknessProbability is low (e.g. under 20), set allergyProbability low or 0. allergyProbability must not exceed sicknessProbability.

Respond with a single JSON object only, no markdown or extra text:
{
  "sicknessProbability": <0-100>,
  "allergyProbability": <0-100, must be <= sicknessProbability; 0 when sickness is low>,
  "symptoms": ["symptom1", "symptom2"],
  "eyeAnalysis": "detailed clinical description including laterality (bilateral/unilateral) and discharge type",
  "environmentalFactors": "summarize pollen and air quality impact on symptoms",
  "recommendations": "specific actionable advice",
  "severity": "none|mild|moderate|severe",
  "shouldSeeDoctor": true or false,
  "isUnilateral": true or false,
  "dischargeType": "none|clear|purulent|unknown"
}`;

  const parts = [
    { inline_data: { mime_type: imageMediaType || 'image/jpeg', data: rawBase64 } },
    { text },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { max_output_tokens: 2048, response_mime_type: 'application/json' },
  });

  const maxRetries = 2;
  let lastErr = null;
  let res;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutMs = 90_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') throw new Error('Analysis timed out. Try a shorter recording or try again.');
      throw fetchErr;
    }

    if (res.ok) break;

    const errText = await res.text();
    lastErr = new Error(`Gemini API: ${res.status} ${errText}`);

    if (res.status === 429 && attempt < maxRetries) {
      let delayMs = 5000;
      try {
        const errJson = JSON.parse(errText);
        const retryInfo = errJson?.error?.details?.find((d) => d['@type']?.includes('RetryInfo'));
        const retryDelay = retryInfo?.retryDelay;
        if (typeof retryDelay === 'string') {
          const match = retryDelay.match(/^(\d+(?:\.\d+)?)\s*s/);
          if (match) delayMs = Math.ceil(parseFloat(match[1]) * 1000);
        }
      } catch (_) {}
      console.warn(`[analyzeWithGemini] 429 rate limit, retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, Math.min(delayMs, 15000)));
      continue;
    }

    if (res.status === 429) {
      throw new Error('Gemini daily request limit reached. Try again tomorrow or check your API plan: https://ai.google.dev/gemini-api/docs/rate-limits');
    }
    throw lastErr;
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
  } catch {
    const fixed = tryFixJsonString(jsonStr);
    try { parsed = JSON.parse(fixed); } catch { parsed = extractJsonFields(jsonStr); }
  }

  const sicknessProbability = Number(parsed.sicknessProbability) || 0;
  let allergyProbability = parsed.allergyProbability != null ? Number(parsed.allergyProbability) || 0 : undefined;
  if (allergyProbability != null && allergyProbability > sicknessProbability) {
    allergyProbability = sicknessProbability;
  }
  return {
    sicknessProbability,
    allergyProbability,
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    eyeAnalysis: parsed.eyeAnalysis != null ? String(parsed.eyeAnalysis) : undefined,
    environmentalFactors: parsed.environmentalFactors != null ? String(parsed.environmentalFactors) : undefined,
    recommendations: parsed.recommendations != null ? String(parsed.recommendations) : undefined,
    severity: parsed.severity != null ? String(parsed.severity) : 'unknown',
    shouldSeeDoctor: Boolean(parsed.shouldSeeDoctor),
    isUnilateral: Boolean(parsed.isUnilateral),
    dischargeType: parsed.dischargeType != null ? String(parsed.dischargeType) : 'unknown',
  };
}

/* ═══════════════  ROUTES  ═══════════════ */

/** POST /analyze — JSON body: imageBase64, imageMediaType, latitude, longitude, optional voiceBase64 + voiceMediaType */
app.post('/analyze', async (req, res) => {
  try {
    const body = req.body || {};
    const imageBase64 = body.imageBase64;
    const imageMediaType = (body.imageMediaType || 'image/jpeg').trim();
    const lat = parseFloat(body.latitude);
    const lon = parseFloat(body.longitude);
    const voiceBase64 = body.hasOwnProperty('voiceBase64') && body.voiceBase64 != null && body.voiceBase64 !== ''
      ? String(body.voiceBase64)
      : null;
    const voiceMimeType = (body.voiceMediaType || 'audio/m4a').trim();

    console.log('[/analyze] Request received', {
      bodyKeys: Object.keys(body),
      hasVoice: Boolean(voiceBase64),
      voiceLen: voiceBase64?.length ?? 0,
    });

    if (!imageBase64 || Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Missing required fields: imageBase64, latitude, longitude' });
    }

    let voiceBuffer = null;
    if (voiceBase64) {
      const raw = toRawBase64(voiceBase64);
      voiceBuffer = Buffer.from(raw, 'base64');
    }

    const [environmentalData, voiceAnalysis] = await Promise.all([
      getGooglePollenData(lat, lon),
      analyzeVoice(voiceBuffer, 'recording.m4a', voiceMimeType),
    ]);

    console.log('[/analyze] Voice analysis result:', JSON.stringify(voiceAnalysis)?.substring(0, 300));
    console.log('[/analyze] Calling Gemini (voice:', !!voiceAnalysis, ', pollen:', !environmentalData?.error, ')');

    const allergyHistory = typeof req.body?.allergyHistory === 'string' ? req.body.allergyHistory : '';
    const aiAnalysis = await analyzeWithGemini({
      imageBase64,
      imageMediaType,
      environmentalData,
      lat,
      lon,
      voiceAnalysis,
      allergyHistory,
    });

    const round6 = (n) => Math.round(n * 1e6) / 1e6;
    const displayName = await reverseGeocodeWithGoogle(lat, lon);
    const result = {
      ...aiAnalysis,
      environmental: environmentalData,
      voice: voiceAnalysis,
      location: {
        latitude: round6(lat),
        longitude: round6(lon),
        ...(displayName && { displayName }),
      },
      timestamp: new Date().toISOString(),
    };

    // History is saved only when the user taps "Save to history" (POST /save-history).

    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

/** GET /history?userId=<uuid> - Fetch user's analysis history */
app.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required query parameter: userId' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'History feature not available (Supabase not configured)' });
    }

    const { data, error } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[/history] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }

    // Transform database records to match frontend AnalysisResult type
    const history = (data || []).map(record => ({
      id: record.id,
      sicknessProbability: record.sickness_probability,
      allergyProbability: record.allergy_probability,
      symptoms: record.symptoms,
      eyeAnalysis: record.eye_analysis,
      environmentalFactors: record.environmental_summary,
      recommendations: record.recommendations,
      severity: record.severity,
      shouldSeeDoctor: record.should_see_doctor,
      isUnilateral: record.is_unilateral,
      dischargeType: record.discharge_type,
      voice: record.voice_analysis,
      environmental: record.pollen_data,
      location: {
        latitude: Number(record.latitude),
        longitude: Number(record.longitude),
        displayName: record.location_display_name,
      },
      timestamp: record.created_at,
    }));

    res.json({ history });
  } catch (err) {
    console.error('[/history] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch history' });
  }
});

/** POST /save-history - Explicitly save a result to history (body: { userId, result }). */
app.post('/save-history', async (req, res) => {
  try {
    const { userId, result } = req.body || {};

    if (!userId || !result) {
      return res.status(400).json({ error: 'Missing required body: userId, result' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'History not available (Supabase not configured)' });
    }

    const lat = Number(result.location?.latitude) || 0;
    const lon = Number(result.location?.longitude) || 0;
    const insertData = {
      user_id: userId,
      eye_image_url: 'base64://not-stored',
      voice_recording_url: result.voice && !result.voice.error ? 'base64://not-stored' : null,
      latitude: lat,
      longitude: lon,
      location_display_name: result.location?.displayName || null,
      pollen_data: result.environmental?.error ? null : result.environmental,
      environmental_summary: result.environmentalFactors || null,
      symptom_description: null,
      allergy_history_snapshot: null,
      sickness_probability: result.sicknessProbability ?? 0,
      sickness_reasoning: null,
      allergy_probability: result.allergyProbability ?? null,
      allergy_reasoning: null,
      severity: result.severity || 'none',
      symptoms: Array.isArray(result.symptoms) ? result.symptoms : [],
      eye_analysis: result.eyeAnalysis || null,
      voice_analysis: result.voice || null,
      recommendations: result.recommendations || null,
      should_see_doctor: Boolean(result.shouldSeeDoctor),
      is_unilateral: Boolean(result.isUnilateral),
      discharge_type: result.dischargeType || 'unknown',
      gemini_raw_response: null,
      analysis_version: '2.0',
    };

    const { data, error } = await supabase
      .from('analysis_history')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('[/save-history] Insert error:', error.code, error.message);
      return res.status(500).json({ error: 'Failed to save to history', details: error.message });
    }

    console.log('[/save-history] Saved for user', userId, 'id', data.id);
    res.json({ saved: true, id: data.id });
  } catch (err) {
    console.error('[/save-history] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to save to history' });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

/** GET /test-db - Test database connection and table existence */
app.get('/test-db', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({
        connected: false,
        error: 'Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
        envCheck: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          urlPrefix: process.env.SUPABASE_URL?.substring(0, 20) + '...'
        }
      });
    }

    // Try to count records in analysis_history table
    const { data, error, count } = await supabase
      .from('analysis_history')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.json({
        connected: true,
        tableExists: false,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
    }

    // Also try to insert a test record with a fake user ID to see if writes work
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error: insertError } = await supabase
      .from('analysis_history')
      .insert({
        user_id: testUserId,
        eye_image_url: 'test',
        latitude: 0,
        longitude: 0,
        sickness_probability: 0
      });

    // Delete the test record if it was created
    if (!insertError) {
      await supabase
        .from('analysis_history')
        .delete()
        .eq('user_id', testUserId);
    }

    return res.json({
      connected: true,
      tableExists: true,
      recordCount: count || 0,
      canWrite: !insertError,
      writeError: insertError ? {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      } : null,
      message: 'Database connection successful!'
    });
  } catch (err) {
    res.json({
      connected: false,
      error: err.message,
      stack: err.stack
    });
  }
});

app.get('/pollen', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Missing or invalid query parameters: lat, lon', example: '/pollen?lat=37.7749&lon=-122.4194' });
    }
    const data = await getGooglePollenData(lat, lon);
    res.json(data);
  } catch (err) {
    console.error('Pollen data error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch pollen data' });
  }
});

app.get('/environmental', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Missing or invalid query parameters: lat, lon', example: '/environmental?lat=37.7749&lon=-122.4194' });
    }
    const data = await getGooglePollenData(lat, lon);
    res.json(data);
  } catch (err) {
    console.error('Environmental data error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch pollen data' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log(`On a device? Use your computer IP, e.g. http://<YOUR_IP>:${PORT}`);
    console.log('Using Google Pollen API for pollen forecast data');
    if (!GEMINI_API_KEY) console.warn('⚠️  GEMINI_API_KEY not set — analysis will fail');
    if (!GOOGLE_POLLEN_KEY) console.warn('⚠️  GOOGLE_POLLEN_API_KEY not set — pollen data will be unavailable');
  });
}

export default app;
