# Expo Voice Analysis Integration - Complete Guide

## 🎉 Integration Complete!

Your Expo mobile app is now integrated with the voice analysis backend using librosa for nasality detection.

## 📱 What's New

### Voice Analysis Features

The app now includes:
- ✅ **Voice recording** with expo-av (5-10 seconds)
- ✅ **Automatic upload** to backend multipart endpoint
- ✅ **Librosa analysis** via Python microservice
- ✅ **Real-time results** displaying:
  - Nasality score (0-100)
  - Confidence level
  - Congestion detection
  - Clinical interpretation
  - Technical metrics (spectral features, MFCC data)

### Updated UI Components

**New Results Display:**
```
🎤 Voice Analysis
├─ Nasality Score: 65.5/100 (color-coded)
├─ Confidence: 78.3%
├─ Nasal Congestion: Detected/Not detected
├─ Interpretation: "Moderate nasality detected..."
└─ Technical Details (expandable)
    ├─ Duration: 5.2s
    ├─ Spectral Centroid: 1885 Hz
    └─ Low/High Ratio: 2.41
```

**Improved Recording Instructions:**
- Guides users to speak for 5-10 seconds
- Suggests words with nasal sounds (morning, sneezing, congestion)
- Better UX for optimal audio quality

## 🚀 How to Use

### Step 1: Start Backend Services

**Terminal 1: Voice Service (Python/librosa)**
```bash
cd backend/voice-service
source venv/bin/activate
python main.py
# Running on http://localhost:3002
```

**Terminal 2: Main Backend (Node.js)**
```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

### Step 2: Start Expo App

**Terminal 3: Mobile App**
```bash
npm start
# Then press 'i' for iOS, 'a' for Android, or 'w' for web
```

### Step 3: Test the Flow

1. **Start Health Check** - Grants permissions
2. **Take Eye Photo** - Uses front camera
3. **Record Voice** - 5-10 seconds of speech
4. **View Results** - See complete multimodal analysis

## 📊 Data Flow

```
Mobile App (Expo)
    ↓ [Multipart Form Data]
Node.js Backend (port 3001)
    ├→ Google Pollen API (environmental data)
    ├→ Python Voice Service (port 3002)
    │   └→ librosa analysis
    │       ├─ MFCC extraction
    │       ├─ Spectral analysis
    │       └─ Nasality scoring
    └→ Gemini Vision API (eye analysis)
    ↓
Combined Results
    ↓
Mobile App Display
```

## 🔧 Configuration

### Backend URL

**Local Development (same computer):**
```bash
# Default - no config needed
http://localhost:3001
```

**Testing on Physical Device:**
```bash
# Create .env file in project root
echo "EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3001" > .env

# Example:
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

Find your IP:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I

# Windows
ipconfig
```

### Voice Service Configuration

The voice service URL is configured in the backend `.env`:
```bash
# backend/.env
VOICE_SERVICE_URL=http://localhost:3002  # Local dev
# or
VOICE_SERVICE_URL=http://voice-service:3002  # Docker
```

## 🧪 Testing Voice Analysis

### Quick Test

```bash
# Test voice service directly
curl -X POST http://localhost:3002/analyze \
  -F "audio=@recording.wav"

# Test full integration
curl -X POST http://localhost:3001/analyze \
  -F "voice=@recording.wav" \
  -F "imageBase64=data:image/jpeg;base64,/9j/4AAQ..." \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

### Mobile App Testing

1. **Record clear audio** - Minimal background noise
2. **Speak for 5-10 seconds** - Optimal duration for analysis
3. **Use nasal words** - "morning", "sneezing", "congestion"
4. **Check results** - Voice analysis should appear in results

## 📋 API Response Structure

```typescript
interface AnalysisResult {
  sicknessProbability: number;
  allergyProbability?: number;
  symptoms?: string[];
  eyeAnalysis?: string;
  environmentalFactors?: string;
  recommendations?: string;
  severity?: string;
  shouldSeeDoctor?: boolean;

  // NEW: Voice Analysis
  voice?: {
    nasality_score: number;        // 0-100
    confidence: number;             // 0-100
    interpretation: string;         // Clinical description
    suggests_congestion: boolean;   // true/false
    features?: {
      duration_seconds: number;
      sample_rate: number;
      spectral?: {
        spectral_centroid_mean: number;
        spectral_rolloff_mean: number;
        spectral_flatness_mean: number;
      };
      formant_proxy?: {
        low_to_high_ratio: number;
        low_band_energy: number;
      };
    };
  } | null;
}
```

## 🎨 UI Color Coding

### Nasality Score
- **Green (0-50)**: Low nasality, normal voice
- **Orange (50-70)**: Moderate nasality, possible congestion
- **Red (70-100)**: High nasality, likely congestion

### Congestion Detection
- **Green**: Not detected
- **Orange**: Detected

## 🐛 Troubleshooting

### "Voice service unavailable"

**Check if services are running:**
```bash
curl http://localhost:3002/health  # Voice service
curl http://localhost:3001/health  # Backend
```

**Restart voice service:**
```bash
cd backend/voice-service
source venv/bin/activate
python main.py
```

### "Cannot reach backend"

**On same computer:**
- Ensure backend is running: `cd backend && npm run dev`
- Check URL in app: should be `http://localhost:3001`

**On physical device:**
- Set `EXPO_PUBLIC_API_URL` in .env to your computer's IP
- Ensure computer and phone are on same WiFi network
- Check firewall allows connections on port 3001

### "Voice analysis returns null"

**Possible causes:**
- Voice service not running (check port 3002)
- Audio file format incompatible (use WAV or M4A)
- Recording too short (minimum 2 seconds)
- Backend can't reach voice service

**Debug:**
```bash
# Check voice service logs
curl -X POST http://localhost:3002/analyze -F "audio=@test.wav"

# Check backend logs
npm run dev  # Watch for voice service errors
```

### "Audio too short" error

- Record at least 2 seconds (recommended 5-10 seconds)
- Check that recording actually started before stopping
- Verify microphone permissions granted

## 📈 Performance Optimization

### Audio Quality
- **Sample Rate**: 22050 Hz or higher (AUTO)
- **Duration**: 5-10 seconds (optimal)
- **Format**: WAV, M4A, MP3 (AUTO converted)
- **Noise**: Minimal background noise

### Analysis Speed
- Voice analysis: 1-3 seconds
- Total analysis: 3-5 seconds (parallel processing)
- Network latency: Depends on connection

## 🔐 Privacy & Security

### Data Handling
- ✅ Audio analyzed in real-time
- ✅ No audio storage on backend
- ✅ Results sent back immediately
- ⚠️ Audio transmitted over HTTP (use HTTPS in production)

### Recommendations for Production
- [ ] Add HTTPS/TLS
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Store FHIR-compliant records
- [ ] Add audit logging

## 🚀 Next Steps

### Immediate
- [x] Test with real voice recordings
- [ ] Tune nasality thresholds based on clinical data
- [ ] Add audio quality validation

### Short Term
- [ ] Add audio playback feature (review recording)
- [ ] Support multiple languages
- [ ] Add voice sample library for testing
- [ ] Implement result history/tracking

### Long Term
- [ ] Train ML model on labeled clinical data
- [ ] Real-time streaming analysis
- [ ] Wearable integration
- [ ] FHIR resource generation
- [ ] Clinical validation study

## 📚 Technical Documentation

### Files Modified
```
app/(tabs)/index.tsx         - Added voice results UI
lib/types.ts                 - Added VoiceAnalysis interface
```

### Files Created
```
backend/voice-service/       - Python microservice
backend/server.js            - Updated with voice integration
EXPO_VOICE_INTEGRATION.md    - This guide
```

### Dependencies
```
# Mobile (existing)
expo-av                      - Audio recording

# Backend (new)
form-data                    - Multipart uploads to Python

# Voice Service (new)
librosa                      - Audio analysis
fastapi                      - REST API
uvicorn                      - ASGI server
```

## 🎓 Understanding the Science

### How Nasality Detection Works

1. **MFCC (Mel-Frequency Cepstral Coefficients)**
   - Captures vocal tract shape
   - Coefficients 2-4 sensitive to nasality
   - Changes with nasal congestion

2. **Spectral Centroid**
   - Center of mass of frequency spectrum
   - Lower in nasal speech (1000-2500 Hz vs 2000-4000 Hz)
   - Key indicator of nasal resonance

3. **Frequency Ratios**
   - Low-to-high frequency energy ratio
   - Higher ratio = more nasal quality
   - Indicates energy distribution

4. **Formant Analysis**
   - Proxy via spectral contrast
   - Tracks resonance patterns
   - Affected by nasal cavities

### Clinical Correlation

- **Allergic Rhinitis** → Nasal congestion → Higher nasality scores
- **Normal Voice** → Clear resonance → Lower nasality scores
- **Confidence** → Based on consistency of indicators

## 📞 Support

### Documentation
- Voice Service: `backend/voice-service/README.md`
- API Guide: `backend/VOICE_SERVICE_QUICKSTART.md`
- Implementation: `backend/VOICE_IMPLEMENTATION_SUMMARY.md`

### Testing
- Integration test: `backend/test-integration.sh`
- Voice test: `backend/voice-service/test_voice_service.py`

---

**Built with ❤️ using:**
- Expo + React Native
- librosa (Python audio analysis)
- FastAPI (Python microservice)
- Node.js/Express (API orchestration)
- Gemini Vision AI
- Google Pollen API
