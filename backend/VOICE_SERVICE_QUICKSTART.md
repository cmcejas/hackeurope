# Voice Analysis Service - Quick Start Guide

This guide helps you get the voice analysis microservice running for local development or testing.

## Prerequisites

- Python 3.11+ (for voice service)
- Node.js 20+ (for main backend)
- OR Docker & Docker Compose

## Option 1: Local Development (Recommended for Development)

### Step 1: Start the Voice Analysis Service

```bash
cd voice-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python main.py
```

The voice service will be running at `http://localhost:3002`

### Step 2: Start the Main Backend

In a new terminal:

```bash
cd /Users/vladmanea/hackeurope/backend

# Install dependencies (if not already done)
npm install

# Start the backend
npm start
# or for development with auto-reload:
npm run dev
```

The main backend will be running at `http://localhost:3001`

### Step 3: Test the Integration

```bash
# Test voice service directly
curl http://localhost:3002/health

# Test main backend
curl http://localhost:3001/health

# Test pollen endpoint
curl "http://localhost:3001/pollen?lat=37.7749&lon=-122.4194"
```

## Option 2: Docker Compose (Recommended for Production)

```bash
cd /Users/vladmanea/hackeurope/backend

# Build and start both services
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Both services will start automatically:
- Voice service: `http://localhost:3002`
- Main backend: `http://localhost:3001`

## Testing Voice Analysis

### Test with a Sample Audio File

You can test the voice analysis with any audio file:

```bash
# Direct test to voice service
curl -X POST http://localhost:3002/analyze \
  -F "audio=@/path/to/your/audio.wav"

# Test through main backend (requires image + location too)
curl -X POST http://localhost:3001/analyze \
  -F "voice=@/path/to/your/audio.wav" \
  -F "imageBase64=data:image/jpeg;base64,/9j/4AAQ..." \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

### Expected Response from Voice Service

```json
{
  "nasality_score": 65.5,
  "confidence": 78.3,
  "features": {
    "duration_seconds": 5.2,
    "sample_rate": 44100,
    "mfcc": {
      "mfcc_mean": [-245.3, 18.7, ...],
      "nasal_mfcc_mean": 12.4
    },
    "spectral": {
      "spectral_centroid_mean": 2156.8,
      "spectral_rolloff_mean": 4321.5
    },
    "formant_proxy": {
      "low_to_high_ratio": 1.8
    }
  },
  "interpretation": "Moderate nasality detected. Voice shows noticeable nasal quality, consistent with mild to moderate nasal congestion, possibly from allergies.",
  "suggests_congestion": true
}
```

## Troubleshooting

### Voice Service Errors

**"Audio too short"**
- Ensure your audio file is at least 2 seconds long
- Recommended: 5-10 seconds for best results

**"Audio processing error"**
- Check that the audio file format is supported (WAV, MP3, M4A, OGG)
- Ensure the file is not corrupted
- Try converting to WAV format

**"Voice service unavailable"**
- Check that the voice service is running: `curl http://localhost:3002/health`
- Check Docker logs: `docker-compose logs voice-service`
- Verify Python dependencies are installed

### Integration Errors

**Backend can't reach voice service**
- If running locally: ensure `VOICE_SERVICE_URL=http://localhost:3002` in .env
- If using Docker: ensure `VOICE_SERVICE_URL=http://voice-service:3002` in docker-compose.yml
- Check both services are on the same network (docker-compose handles this automatically)

### Audio Quality Issues

For best results:
- Use clear audio with minimal background noise
- Record 5-10 seconds of continuous speech
- Use a decent microphone (not phone speaker)
- Avoid very compressed audio formats

## Development Workflow

### Making Changes to Voice Service

1. Edit `voice-service/main.py`
2. If using local: restart the service (Ctrl+C, then `python main.py`)
3. If using Docker: rebuild with `docker-compose up --build voice-service`

### Adding New Audio Features

The voice analysis pipeline has three main feature extraction functions:

1. `extract_mfcc_features()` - Vocal tract shape
2. `extract_spectral_features()` - Frequency characteristics
3. `extract_formant_proxy_features()` - Formant estimation

To add new features:
1. Create a new extraction function
2. Call it in the `/analyze` endpoint
3. Update `calculate_nasality_score()` to include the new features

## Next Steps

- [ ] Integrate with Expo mobile app for voice recording
- [ ] Test with real patient recordings
- [ ] Tune nasality scoring thresholds based on clinical data
- [ ] Add caching for repeated analysis
- [ ] Implement authentication between services
- [ ] Add monitoring and logging

## Environment Variables

### Backend (.env)
```bash
GEMINI_API_KEY=your_gemini_key
GOOGLE_POLLEN_API_KEY=your_pollen_key
PORT=3001
VOICE_SERVICE_URL=http://localhost:3002  # or http://voice-service:3002 in Docker
```

### Voice Service
No environment variables required currently. Port is hardcoded to 3002.

## Performance

- Voice analysis typically takes 1-3 seconds
- Main bottleneck is audio loading and feature extraction
- Can handle concurrent requests (FastAPI is async)
- Consider adding Redis caching for repeated analysis of same audio

## API Documentation

Once running, visit:
- Voice Service API docs: `http://localhost:3002/docs`
- Interactive API testing: `http://localhost:3002/redoc`
