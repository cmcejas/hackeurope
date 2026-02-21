"""
Voice Analysis Microservice using librosa
Analyzes audio recordings to detect nasality indicators for allergy diagnosis
"""

import io
import numpy as np
import librosa
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="Voice Analysis Service", version="1.0.0")

# Enable CORS for Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VoiceAnalysisResult(BaseModel):
    """Voice analysis result schema"""
    nasality_score: float  # 0-100, higher = more nasal
    confidence: float  # 0-100
    features: Dict[str, Any]
    interpretation: str
    suggests_congestion: bool


def extract_mfcc_features(audio_data: np.ndarray, sr: int) -> Dict[str, float]:
    """
    Extract MFCC (Mel-Frequency Cepstral Coefficients) features.
    MFCCs capture the shape of the vocal tract, which changes with nasal congestion.
    """
    # Extract 13 MFCC coefficients (standard for speech analysis)
    mfccs = librosa.feature.mfcc(y=audio_data, sr=sr, n_mfcc=13)

    # Calculate statistics for each coefficient
    mfcc_mean = np.mean(mfccs, axis=1)
    mfcc_std = np.std(mfccs, axis=1)
    mfcc_delta = np.mean(librosa.feature.delta(mfccs), axis=1)

    return {
        'mfcc_mean': mfcc_mean.tolist(),
        'mfcc_std': mfcc_std.tolist(),
        'mfcc_delta': mfcc_delta.tolist(),
        # MFCC 2-4 are particularly sensitive to nasality
        'nasal_mfcc_mean': float(np.mean(mfcc_mean[2:5])),
        'nasal_mfcc_std': float(np.mean(mfcc_std[2:5])),
    }


def extract_spectral_features(audio_data: np.ndarray, sr: int) -> Dict[str, float]:
    """
    Extract spectral features that indicate nasal quality.
    Nasal speech shows characteristic changes in spectral centroid and rolloff.
    """
    # Spectral centroid (center of mass of spectrum)
    # Nasal sounds often have lower spectral centroid
    centroid = librosa.feature.spectral_centroid(y=audio_data, sr=sr)

    # Spectral rolloff (frequency below which 85% of energy is contained)
    rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=sr, roll_percent=0.85)

    # Spectral flatness (tonality indicator)
    flatness = librosa.feature.spectral_flatness(y=audio_data)

    # Zero crossing rate (indicator of high-frequency content)
    zcr = librosa.feature.zero_crossing_rate(audio_data)

    return {
        'spectral_centroid_mean': float(np.mean(centroid)),
        'spectral_centroid_std': float(np.std(centroid)),
        'spectral_rolloff_mean': float(np.mean(rolloff)),
        'spectral_rolloff_std': float(np.std(rolloff)),
        'spectral_flatness_mean': float(np.mean(flatness)),
        'zero_crossing_rate_mean': float(np.mean(zcr)),
    }


def extract_formant_proxy_features(audio_data: np.ndarray, sr: int) -> Dict[str, float]:
    """
    Extract features that approximate formant analysis.
    Nasal consonants show distinct formant patterns, especially in lower frequencies.
    """
    # Use spectral contrast as a proxy for formant structure
    contrast = librosa.feature.spectral_contrast(y=audio_data, sr=sr, n_bands=6)

    # Calculate energy in different frequency bands
    # Nasal sounds have characteristic energy distribution
    low_band_energy = float(np.mean(contrast[0:2, :]))  # Low frequencies
    mid_band_energy = float(np.mean(contrast[2:4, :]))  # Mid frequencies
    high_band_energy = float(np.mean(contrast[4:6, :]))  # High frequencies

    return {
        'low_band_energy': low_band_energy,
        'mid_band_energy': mid_band_energy,
        'high_band_energy': high_band_energy,
        'low_to_high_ratio': low_band_energy / (high_band_energy + 1e-6),
    }


def calculate_nasality_score(mfcc_features: Dict, spectral_features: Dict,
                             formant_features: Dict) -> tuple[float, float]:
    """
    Calculate nasality score based on acoustic features.

    Research-backed indicators of nasality:
    - Lower spectral centroid (nasal resonance in lower frequencies)
    - Higher energy in low frequency bands
    - Specific MFCC patterns (coefficients 2-4)
    - Lower spectral rolloff

    Returns: (nasality_score, confidence)
    """
    indicators = []

    # 1. Spectral centroid indicator (lower = more nasal)
    # Typical speech: 2000-4000 Hz, Nasal speech: 1000-2500 Hz
    centroid = spectral_features['spectral_centroid_mean']
    if centroid < 1500:
        centroid_score = 90
    elif centroid < 2000:
        centroid_score = 70
    elif centroid < 2500:
        centroid_score = 50
    elif centroid < 3000:
        centroid_score = 30
    else:
        centroid_score = 10
    indicators.append(('spectral_centroid', centroid_score, 0.3))

    # 2. Low-to-high frequency ratio (higher = more nasal)
    ratio = formant_features['low_to_high_ratio']
    if ratio > 2.5:
        ratio_score = 90
    elif ratio > 2.0:
        ratio_score = 70
    elif ratio > 1.5:
        ratio_score = 50
    elif ratio > 1.0:
        ratio_score = 30
    else:
        ratio_score = 10
    indicators.append(('frequency_ratio', ratio_score, 0.25))

    # 3. MFCC nasal indicator (MFCCs 2-4 are sensitive to nasality)
    nasal_mfcc = mfcc_features['nasal_mfcc_mean']
    # Normalize based on typical range (-50 to 50)
    nasal_mfcc_normalized = max(0, min(100, (nasal_mfcc + 50) * 1.0))
    indicators.append(('mfcc_nasal', nasal_mfcc_normalized, 0.2))

    # 4. Spectral rolloff (lower = more energy in low freqs = more nasal)
    rolloff = spectral_features['spectral_rolloff_mean']
    if rolloff < 3000:
        rolloff_score = 80
    elif rolloff < 4000:
        rolloff_score = 60
    elif rolloff < 5000:
        rolloff_score = 40
    else:
        rolloff_score = 20
    indicators.append(('spectral_rolloff', rolloff_score, 0.15))

    # 5. Low band energy (higher = more nasal resonance)
    low_energy = formant_features['low_band_energy']
    if low_energy > 40:
        energy_score = 80
    elif low_energy > 30:
        energy_score = 60
    elif low_energy > 20:
        energy_score = 40
    else:
        energy_score = 20
    indicators.append(('low_band_energy', energy_score, 0.1))

    # Calculate weighted average
    nasality_score = sum(score * weight for _, score, weight in indicators)

    # Calculate confidence based on consistency of indicators
    scores = [score for _, score, _ in indicators]
    consistency = 100 - (np.std(scores) / 100 * 100)  # Lower std = higher confidence
    confidence = max(50, min(100, consistency))

    return round(nasality_score, 2), round(confidence, 2)


def interpret_nasality_score(score: float, confidence: float) -> tuple[str, bool]:
    """
    Provide clinical interpretation of nasality score.

    Returns: (interpretation_text, suggests_congestion)
    """
    if score >= 70:
        interpretation = (
            "High nasality detected. Voice shows strong nasal quality, "
            "highly consistent with nasal congestion from allergic rhinitis or upper respiratory issues."
        )
        suggests_congestion = True
    elif score >= 50:
        interpretation = (
            "Moderate nasality detected. Voice shows noticeable nasal quality, "
            "consistent with mild to moderate nasal congestion, possibly from allergies."
        )
        suggests_congestion = True
    elif score >= 30:
        interpretation = (
            "Mild nasality detected. Some nasal quality present, "
            "may indicate minor congestion or natural voice characteristics."
        )
        suggests_congestion = False
    else:
        interpretation = (
            "Low nasality detected. Voice shows normal quality "
            "with minimal nasal characteristics."
        )
        suggests_congestion = False

    if confidence < 60:
        interpretation += f" (Note: Low confidence {confidence:.0f}% - audio quality may be suboptimal)"

    return interpretation, suggests_congestion


@app.post("/analyze", response_model=VoiceAnalysisResult)
async def analyze_voice(audio: UploadFile = File(...)):
    """
    Analyze voice recording for nasality indicators.

    Accepts audio files in common formats (WAV, MP3, M4A, OGG, etc.)
    Returns nasality score and interpretation.
    """
    try:
        # Read audio file
        audio_bytes = await audio.read()

        # Load audio with librosa
        # librosa can handle various formats via audioread/soundfile
        audio_data, sample_rate = librosa.load(
            io.BytesIO(audio_bytes),
            sr=None,  # Preserve original sample rate
            mono=True  # Convert to mono for analysis
        )

        # Validate audio duration (should be 5-10 seconds per requirements)
        duration = len(audio_data) / sample_rate
        if duration < 2:
            raise HTTPException(
                status_code=400,
                detail="Audio too short (minimum 2 seconds required for reliable analysis)"
            )
        if duration > 30:
            # Trim to first 30 seconds if longer
            audio_data = audio_data[:30 * sample_rate]

        # Extract features
        mfcc_features = extract_mfcc_features(audio_data, sample_rate)
        spectral_features = extract_spectral_features(audio_data, sample_rate)
        formant_features = extract_formant_proxy_features(audio_data, sample_rate)

        # Calculate nasality score
        nasality_score, confidence = calculate_nasality_score(
            mfcc_features, spectral_features, formant_features
        )

        # Generate interpretation
        interpretation, suggests_congestion = interpret_nasality_score(
            nasality_score, confidence
        )

        # Combine all features for detailed response
        all_features = {
            'duration_seconds': round(duration, 2),
            'sample_rate': sample_rate,
            'mfcc': mfcc_features,
            'spectral': spectral_features,
            'formant_proxy': formant_features,
        }

        return VoiceAnalysisResult(
            nasality_score=nasality_score,
            confidence=confidence,
            features=all_features,
            interpretation=interpretation,
            suggests_congestion=suggests_congestion
        )

    except librosa.LibrosaError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Audio processing error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "voice-analysis",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
