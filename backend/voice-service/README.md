# Voice Analysis Microservice

Python microservice using FastAPI and librosa for analyzing voice recordings to detect nasality indicators associated with allergic rhinitis and nasal congestion.

## Features

- **MFCC Analysis**: Extracts Mel-Frequency Cepstral Coefficients (MFCCs) which capture vocal tract shape changes
- **Spectral Analysis**: Analyzes spectral centroid, rolloff, flatness, and zero-crossing rate
- **Formant Proxy Features**: Estimates formant structure using spectral contrast
- **Nasality Scoring**: Combines multiple acoustic features to calculate nasality score (0-100)
- **Clinical Interpretation**: Provides human-readable interpretation and congestion likelihood

## Installation

### Local Development

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 3002 --reload
```

### Docker

Build and run:
```bash
docker build -t voice-service .
docker run -p 3002:3002 voice-service
```

Or use docker-compose from the parent directory:
```bash
cd ..
docker-compose up voice-service
```

## API Endpoints

### POST /analyze

Analyzes a voice recording for nasality indicators.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `audio` file (WAV, MP3, M4A, OGG, etc.)

**Response:**
```json
{
  "nasality_score": 65.5,
  "confidence": 78.3,
  "features": {
    "duration_seconds": 5.2,
    "sample_rate": 44100,
    "mfcc": { ... },
    "spectral": { ... },
    "formant_proxy": { ... }
  },
  "interpretation": "Moderate nasality detected...",
  "suggests_congestion": true
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "voice-analysis",
  "version": "1.0.0"
}
```

## How It Works

### Nasality Detection Algorithm

The service uses multiple acoustic features to detect nasal quality in speech:

1. **Spectral Centroid** (30% weight)
   - Nasal speech has lower spectral centroid (1000-2500 Hz vs 2000-4000 Hz)
   - Indicates energy concentration in lower frequencies

2. **Low-to-High Frequency Ratio** (25% weight)
   - Nasal resonance increases low-frequency energy
   - Higher ratio = more nasality

3. **MFCC Coefficients 2-4** (20% weight)
   - These coefficients are particularly sensitive to nasality
   - Capture vocal tract shape changes from congestion

4. **Spectral Rolloff** (15% weight)
   - Lower rolloff indicates more energy in low frequencies
   - Characteristic of nasal speech

5. **Low Band Energy** (10% weight)
   - Direct measure of low-frequency resonance
   - Higher values suggest nasal quality

### Scoring Interpretation

- **70-100**: High nasality - strong indication of nasal congestion
- **50-69**: Moderate nasality - noticeable nasal quality
- **30-49**: Mild nasality - some nasal characteristics
- **0-29**: Low nasality - normal voice quality

## Technical Details

### Dependencies

- **librosa**: Audio analysis and feature extraction
- **numpy**: Numerical computations
- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **python-multipart**: Multipart form data parsing

### Audio Processing

- Accepts various audio formats (WAV, MP3, M4A, OGG)
- Converts to mono for consistent analysis
- Minimum duration: 2 seconds
- Maximum duration: 30 seconds (auto-trimmed)
- Sample rate: preserved from original recording

### Performance

- Typical analysis time: 1-3 seconds per recording
- Depends on audio duration and quality
- Optimized for 5-10 second recordings

## Integration

This service is designed to work with the HackEurope backend:

```javascript
// Node.js backend calls this service
const formData = new FormData();
formData.append('audio', voiceFile.buffer, {
  filename: 'recording.wav',
  contentType: 'audio/wav',
});

const response = await fetch('http://localhost:3002/analyze', {
  method: 'POST',
  body: formData,
});

const voiceAnalysis = await response.json();
```

## Research Background

The nasality detection algorithm is based on established research in acoustic phonetics:

- Nasal consonants (/m/, /n/, /ŋ/) have distinct spectral patterns
- Nasal congestion affects formant frequencies and amplitudes
- MFCC coefficients effectively capture these changes
- Spectral measures (centroid, rolloff) correlate with perceived nasality

## Limitations

- Requires clear audio with minimal background noise
- Best results with 5-10 seconds of continuous speech
- Accuracy may vary based on speaker's natural voice characteristics
- Not a substitute for clinical diagnosis - use as screening tool only

## Future Enhancements

- [ ] Deep learning model for improved accuracy
- [ ] Support for real-time streaming analysis
- [ ] Multi-language phoneme analysis
- [ ] Integration with wearable devices
- [ ] Longitudinal tracking and trend analysis
