import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_POLLEN_KEY = process.env.GOOGLE_POLLEN_API_KEY;
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:3002';

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

/** Fetch pollen data from Google Pollen API */
async function getGooglePollenData(lat, lon) {
  if (!GOOGLE_POLLEN_KEY) {
    return { error: 'Google Pollen API key not configured' };
  }

  // Google Pollen API provides daily forecast for multiple days
  // We'll request historical + forecast data (up to 5 days)
  const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLE_POLLEN_KEY}&location.latitude=${lat}&location.longitude=${lon}&days=5`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
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

/** Analyze Google Pollen API data and calculate meaningful summaries */
function analyzeGooglePollenData(data, lat, lon) {
  if (!data.dailyInfo || data.dailyInfo.length === 0) {
    return { error: 'No pollen data available for this location' };
  }

  // Google Pollen API provides daily forecasts with pollen types and indices
  const dailyInfo = data.dailyInfo;

  // Extract pollen information from all days
  const pollenTypes = {
    tree: { name: 'Tree', values: [], index: [] },
    grass: { name: 'Grass', values: [], index: [] },
    weed: { name: 'Weed', values: [], index: [] }
  };

  // UPI (Universal Pollen Index) ranges: 0-1 (None), 1-2 (Low), 2-3 (Moderate), 3-4 (High), 4-5 (Very High)
  const indexToLevel = (index) => {
    if (index === null || index === undefined || index < 1) return 'none';
    if (index < 2) return 'low';
    if (index < 3) return 'moderate';
    if (index < 4) return 'high';
    return 'very_high';
  };

  const indexToScore = (index) => {
    if (index === null || index === undefined || index < 1) return 0;
    if (index < 2) return 10;
    if (index < 3) return 25;
    if (index < 4) return 40;
    return 50;
  };

  let maxPollenIndex = 0;
  let dominantTypes = [];

  dailyInfo.forEach(day => {
    if (day.pollenTypeInfo) {
      day.pollenTypeInfo.forEach(typeInfo => {
        const code = typeInfo.code?.toLowerCase();
        if (code && pollenTypes[code]) {
          const index = typeInfo.indexInfo?.value || 0;
          pollenTypes[code].values.push(typeInfo.indexInfo?.category || 'NONE');
          pollenTypes[code].index.push(index);
          maxPollenIndex = Math.max(maxPollenIndex, index);

          // Track for dominant types
          if (index >= 2) { // Moderate or higher
            dominantTypes.push({
              type: pollenTypes[code].name,
              level: typeInfo.indexInfo?.category || 'UNKNOWN',
              index: index,
              date: day.date
            });
          }
        }
      });
    }
  });

  // Calculate overall pollen level
  const overallLevel = indexToLevel(maxPollenIndex);

  // Get plant info if available
  const plantInfo = [];
  if (dailyInfo[0]?.plantInfo) {
    dailyInfo[0].plantInfo.forEach(plant => {
      if (plant.inSeason && plant.indexInfo?.value >= 2) {
        plantInfo.push({
          name: plant.displayName || plant.code,
          type: plant.plantDescription?.type || 'unknown',
          level: plant.indexInfo?.category || 'UNKNOWN',
          index: plant.indexInfo?.value || 0
        });
      }
    });
  }

  // Sort dominant types by index (highest first)
  dominantTypes.sort((a, b) => b.index - a.index);

  // Keep only unique types (take highest index for each)
  const uniqueDominant = [];
  const seenTypes = new Set();
  dominantTypes.forEach(dt => {
    if (!seenTypes.has(dt.type)) {
      uniqueDominant.push(dt);
      seenTypes.add(dt.type);
    }
  });

  // Calculate allergy risk score
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
        tree: {
          name: 'Tree',
          currentLevel: pollenTypes.tree.values[0] || 'NONE',
          maxIndex: pollenTypes.tree.index.length > 0 ? Math.max(...pollenTypes.tree.index) : 0,
          forecast: pollenTypes.tree.values
        },
        grass: {
          name: 'Grass',
          currentLevel: pollenTypes.grass.values[0] || 'NONE',
          maxIndex: pollenTypes.grass.index.length > 0 ? Math.max(...pollenTypes.grass.index) : 0,
          forecast: pollenTypes.grass.values
        },
        weed: {
          name: 'Weed',
          currentLevel: pollenTypes.weed.values[0] || 'NONE',
          maxIndex: pollenTypes.weed.index.length > 0 ? Math.max(...pollenTypes.weed.index) : 0,
          forecast: pollenTypes.weed.values
        }
      },
      dominantTypes: uniqueDominant.slice(0, 3), // Top 3
      plantsInSeason: plantInfo.slice(0, 5) // Top 5 plants
    },
    allergyRiskScore
  };
}

/** Calculate allergy risk score based on Google Pollen Index */
function calculateGooglePollenRisk(pollenScore) {
  // Google Pollen Index is 0-5, we convert to 0-100 score
  // pollenScore is already 0-50 from indexToScore

  // For Google Pollen API, we don't have air quality data
  // So the score is purely based on pollen levels
  const score = pollenScore * 2; // Convert 0-50 to 0-100

  const level =
    score < 20 ? 'low' :
    score < 40 ? 'moderate' :
    score < 70 ? 'high' : 'very_high';

  return {
    score,
    level,
    note: 'Based on pollen levels only (air quality not available from Google Pollen API)'
  };
}

/** Strip data URL prefix if present; Gemini expects raw base64 only */
function toRawBase64(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^data:[\w/+-]+;base64,(.+)$/);
  return match ? match[1].trim() : value.trim();
}

/** Analyze voice recording using Python microservice with librosa */
async function analyzeVoice(voiceFile) {
  if (!voiceFile) {
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('audio', voiceFile.buffer, {
      filename: voiceFile.originalname || 'recording.wav',
      contentType: voiceFile.mimetype || 'audio/wav',
    });

    const response = await fetch(`${VOICE_SERVICE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Voice service error:', response.status, errorText);
      return {
        error: `Voice analysis failed: ${response.status}`,
        details: errorText
      };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Voice analysis error:', err);
    return {
      error: 'Voice service unavailable',
      details: err.message
    };
  }
}

/** Call Gemini with image + text and return structured health assessment */
async function analyzeWithGemini({ imageBase64, imageMediaType, environmentalData, lat, lon, voiceAnalysis }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const rawBase64 = toRawBase64(imageBase64);

  // Format environmental data for better context
  const envSummary = environmentalData.error ?
    `Environmental data unavailable: ${environmentalData.error}` :
    `Pollen Level: ${environmentalData.pollen?.level || 'unknown'} (index: ${environmentalData.pollen?.maxIndex || 0}/5)
Pollen Types: Tree=${environmentalData.pollen?.types?.tree?.currentLevel || 'N/A'}, Grass=${environmentalData.pollen?.types?.grass?.currentLevel || 'N/A'}, Weed=${environmentalData.pollen?.types?.weed?.currentLevel || 'N/A'}
Dominant Allergens: ${environmentalData.pollen?.dominantTypes?.map(t => `${t.type} (${t.level})`).join(', ') || 'none detected'}
Plants in Season: ${environmentalData.pollen?.plantsInSeason?.map(p => p.name).join(', ') || 'none detected'}
Allergy Risk: ${environmentalData.allergyRiskScore?.level || 'unknown'} (score: ${environmentalData.allergyRiskScore?.score || 0}/100)
Source: Google Pollen API - ${environmentalData.period || 'multi-day'} forecast`;

  // Format voice analysis data
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

**IMPORTANT SAFETY RULES**:
- If redness is UNILATERAL (one eye only), set "shouldSeeDoctor": true and flag as urgent
- If purulent discharge is present, recommend immediate medical consultation
- Consider environmental pollen levels when assessing allergy probability

Respond with a single JSON object only, no markdown or extra text:
{
  "sicknessProbability": <0-100>,
  "allergyProbability": <0-100>,
  "symptoms": ["symptom1", "symptom2"],
  "eyeAnalysis": "detailed clinical description including laterality (bilateral/unilateral) and discharge type",
  "environmentalFactors": "summarize pollen and air quality impact on symptoms",
  "recommendations": "specific actionable advice",
  "severity": "none|mild|moderate|severe",
  "shouldSeeDoctor": true or false,
  "isUnilateral": true or false,
  "dischargeType": "none|clear|purulent|unknown"
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
    allergyProbability: Number(parsed.allergyProbability) || 0,
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    eyeAnalysis: parsed.eyeAnalysis,
    environmentalFactors: parsed.environmentalFactors,
    recommendations: parsed.recommendations,
    severity: parsed.severity || 'unknown',
    shouldSeeDoctor: Boolean(parsed.shouldSeeDoctor),
    isUnilateral: Boolean(parsed.isUnilateral),
    dischargeType: parsed.dischargeType || 'unknown',
  };
}

/** POST /analyze — multipart: imageBase64, imageMediaType, latitude, longitude, optional voice file */
app.post('/analyze', upload.single('voice'), async (req, res) => {
  try {
    const imageBase64 = req.body?.imageBase64;
    const imageMediaType = (req.body?.imageMediaType || 'image/jpeg').trim();
    const lat = parseFloat(req.body?.latitude);
    const lon = parseFloat(req.body?.longitude);

    if (!imageBase64 || Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: 'Missing required fields: imageBase64, latitude, longitude',
      });
    }

    // Analyze voice if provided (parallel with pollen data)
    const [environmentalData, voiceAnalysis] = await Promise.all([
      getGooglePollenData(lat, lon),
      analyzeVoice(req.file)
    ]);

    // Perform AI analysis with environmental and voice context
    const aiAnalysis = await analyzeWithGemini({
      imageBase64,
      imageMediaType,
      environmentalData,
      lat,
      lon,
      voiceAnalysis,
    });

    // Combine all analysis results
    const result = {
      ...aiAnalysis,
      environmental: environmentalData,
      voice: voiceAnalysis,
      location: { latitude: lat, longitude: lon },
      timestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({
      error: err.message || 'Analysis failed',
    });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

/** GET /pollen?lat=X&lon=Y — Test endpoint for pollen data */
app.get('/pollen', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: 'Missing or invalid query parameters: lat, lon',
        example: '/pollen?lat=37.7749&lon=-122.4194'
      });
    }

    const data = await getGooglePollenData(lat, lon);
    res.json(data);
  } catch (err) {
    console.error('Pollen data error:', err);
    res.status(500).json({
      error: err.message || 'Failed to fetch pollen data',
    });
  }
});

// Legacy endpoint for backwards compatibility
app.get('/environmental', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        error: 'Missing or invalid query parameters: lat, lon',
        example: '/environmental?lat=37.7749&lon=-122.4194'
      });
    }

    const data = await getGooglePollenData(lat, lon);
    res.json(data);
  } catch (err) {
    console.error('Environmental data error:', err);
    res.status(500).json({
      error: err.message || 'Failed to fetch pollen data',
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`On a device? Use your computer IP, e.g. http://<YOUR_IP>:${PORT}`);
  console.log('Using Google Pollen API for pollen forecast data');
  if (!GEMINI_API_KEY) console.warn('⚠️  GEMINI_API_KEY not set — analysis will fail');
  if (!GOOGLE_POLLEN_KEY) console.warn('⚠️  GOOGLE_POLLEN_API_KEY not set — pollen data will be unavailable');
});
