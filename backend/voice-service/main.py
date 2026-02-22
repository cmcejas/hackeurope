"""
Voice Analysis Microservice using librosa
Analyzes audio recordings to detect nasality indicators for allergy diagnosis
"""

import io
import os
import shutil
import subprocess
import tempfile
import time
import logging

import numpy as np
import librosa
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-service")

HAS_FFMPEG = shutil.which("ffmpeg") is not None
SOUNDFILE_FORMATS = {".wav", ".flac", ".ogg"}
NEEDS_FFMPEG = {".webm", ".m4a", ".mp4", ".opus", ".mp3", ".aac"}

app = FastAPI(title="Voice Analysis Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VoiceAnalysisResult(BaseModel):
    nasality_score: float
    confidence: float
    features: Dict[str, Any]
    interpretation: str
    suggests_congestion: bool


def _detect_ext(filename: str | None, content_type: str | None) -> str:
    """Best-guess file extension from filename or content-type."""
    if filename and "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower()
        if ext in SOUNDFILE_FORMATS | NEEDS_FFMPEG:
            return ext
    ct = (content_type or "").lower()
    if "webm" in ct:
        return ".webm"
    if "ogg" in ct or "opus" in ct:
        return ".ogg"
    if "mp4" in ct or "m4a" in ct or "aac" in ct:
        return ".m4a"
    if "mp3" in ct or "mpeg" in ct:
        return ".mp3"
    if "wav" in ct:
        return ".wav"
    return ".webm"


def _convert_with_ffmpeg(audio_bytes: bytes, ext: str) -> tuple:
    """Convert audio to WAV using ffmpeg, then load with librosa. Returns (audio_data, sr)."""
    if not HAS_FFMPEG:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot decode {ext} audio. Install ffmpeg: sudo apt-get install -y ffmpeg",
        )
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_in:
        tmp_in.write(audio_bytes)
        tmp_in_path = tmp_in.name
    tmp_out_path = tmp_in_path.rsplit(".", 1)[0] + ".wav"
    try:
        proc = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in_path, "-ar", "22050", "-ac", "1", tmp_out_path],
            capture_output=True,
            timeout=15,
        )
        if proc.returncode != 0:
            stderr = proc.stderr.decode(errors="ignore")[:300]
            raise HTTPException(status_code=400, detail=f"ffmpeg conversion failed: {stderr}")
        audio_data, sr = librosa.load(tmp_out_path, sr=None, mono=True)
        return audio_data, sr
    finally:
        for p in (tmp_in_path, tmp_out_path):
            if os.path.exists(p):
                os.unlink(p)


def extract_mfcc_features(audio_data: np.ndarray, sr: int) -> Dict[str, float]:
    mfccs = librosa.feature.mfcc(y=audio_data, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfccs, axis=1)
    mfcc_std = np.std(mfccs, axis=1)
    mfcc_delta = np.mean(librosa.feature.delta(mfccs), axis=1)

    return {
        "mfcc_mean": mfcc_mean.tolist(),
        "mfcc_std": mfcc_std.tolist(),
        "mfcc_delta": mfcc_delta.tolist(),
        "nasal_mfcc_mean": float(np.mean(mfcc_mean[2:5])),
        "nasal_mfcc_std": float(np.mean(mfcc_std[2:5])),
    }


def extract_spectral_features(audio_data: np.ndarray, sr: int) -> Dict[str, float]:
    centroid = librosa.feature.spectral_centroid(y=audio_data, sr=sr)
    rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=sr, roll_percent=0.85)
    flatness = librosa.feature.spectral_flatness(y=audio_data)
    zcr = librosa.feature.zero_crossing_rate(audio_data)

    return {
        "spectral_centroid_mean": float(np.mean(centroid)),
        "spectral_centroid_std": float(np.std(centroid)),
        "spectral_rolloff_mean": float(np.mean(rolloff)),
        "spectral_rolloff_std": float(np.std(rolloff)),
        "spectral_flatness_mean": float(np.mean(flatness)),
        "zero_crossing_rate_mean": float(np.mean(zcr)),
    }


def extract_formant_proxy_features(audio_data: np.ndarray, sr: int) -> Dict[str, float]:
    contrast = librosa.feature.spectral_contrast(y=audio_data, sr=sr, n_bands=6)
    low_band_energy = float(np.mean(contrast[0:2, :]))
    mid_band_energy = float(np.mean(contrast[2:4, :]))
    high_band_energy = float(np.mean(contrast[4:6, :]))

    return {
        "low_band_energy": low_band_energy,
        "mid_band_energy": mid_band_energy,
        "high_band_energy": high_band_energy,
        "low_to_high_ratio": low_band_energy / (high_band_energy + 1e-6),
    }


def calculate_nasality_score(
    mfcc_features: Dict, spectral_features: Dict, formant_features: Dict
) -> tuple[float, float]:
    indicators = []

    centroid = spectral_features["spectral_centroid_mean"]
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
    indicators.append(("spectral_centroid", centroid_score, 0.3))

    ratio = formant_features["low_to_high_ratio"]
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
    indicators.append(("frequency_ratio", ratio_score, 0.25))

    nasal_mfcc = mfcc_features["nasal_mfcc_mean"]
    nasal_mfcc_normalized = max(0, min(100, (nasal_mfcc + 50) * 1.0))
    indicators.append(("mfcc_nasal", nasal_mfcc_normalized, 0.2))

    rolloff = spectral_features["spectral_rolloff_mean"]
    if rolloff < 3000:
        rolloff_score = 80
    elif rolloff < 4000:
        rolloff_score = 60
    elif rolloff < 5000:
        rolloff_score = 40
    else:
        rolloff_score = 20
    indicators.append(("spectral_rolloff", rolloff_score, 0.15))

    low_energy = formant_features["low_band_energy"]
    if low_energy > 40:
        energy_score = 80
    elif low_energy > 30:
        energy_score = 60
    elif low_energy > 20:
        energy_score = 40
    else:
        energy_score = 20
    indicators.append(("low_band_energy", energy_score, 0.1))

    nasality_score = sum(score * weight for _, score, weight in indicators)

    scores = [score for _, score, _ in indicators]
    consistency = 100 - (float(np.std(scores)) / 100 * 100)
    confidence = max(50, min(100, consistency))

    return round(nasality_score, 2), round(confidence, 2)


def interpret_nasality_score(score: float, confidence: float) -> tuple[str, bool]:
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
    """Analyze voice recording for nasality indicators."""
    t0 = time.time()
    try:
        audio_bytes = await audio.read()
        logger.info("Received audio: filename=%s, content_type=%s, size=%d bytes",
                     audio.filename, audio.content_type, len(audio_bytes))

        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio file is empty or too small")

        ext = _detect_ext(audio.filename, audio.content_type)
        logger.info("Detected format: %s (ffmpeg available: %s)", ext, HAS_FFMPEG)

        if ext in NEEDS_FFMPEG:
            logger.info("Format %s requires ffmpeg conversion", ext)
            audio_data, sample_rate = _convert_with_ffmpeg(audio_bytes, ext)
        else:
            try:
                audio_data, sample_rate = librosa.load(io.BytesIO(audio_bytes), sr=None, mono=True)
            except Exception as e:
                logger.warning("librosa.load() failed for %s, trying ffmpeg: %s", ext, e)
                audio_data, sample_rate = _convert_with_ffmpeg(audio_bytes, ext)

        duration = len(audio_data) / sample_rate
        logger.info("Audio loaded: sr=%d, duration=%.2fs", sample_rate, duration)

        if duration < 1:
            raise HTTPException(
                status_code=400,
                detail="Audio too short (minimum 1 second required for reliable analysis)",
            )
        if duration > 30:
            audio_data = audio_data[: 30 * sample_rate]

        mfcc_features = extract_mfcc_features(audio_data, sample_rate)
        spectral_features = extract_spectral_features(audio_data, sample_rate)
        formant_features = extract_formant_proxy_features(audio_data, sample_rate)

        nasality_score, confidence = calculate_nasality_score(
            mfcc_features, spectral_features, formant_features
        )
        interpretation, suggests_congestion = interpret_nasality_score(nasality_score, confidence)

        all_features = {
            "duration_seconds": round(duration, 2),
            "sample_rate": sample_rate,
            "mfcc": mfcc_features,
            "spectral": spectral_features,
            "formant_proxy": formant_features,
        }

        logger.info("Analysis complete in %.2fs: nasality=%.1f, confidence=%.1f",
                     time.time() - t0, nasality_score, confidence)

        return VoiceAnalysisResult(
            nasality_score=nasality_score,
            confidence=confidence,
            features=all_features,
            interpretation=interpretation,
            suggests_congestion=suggests_congestion,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "voice-analysis",
        "version": "1.0.0",
        "ffmpeg": HAS_FFMPEG,
    }


def _warmup():
    """Run a dummy analysis on startup so numpy/librosa JIT is prewarmed."""
    t0 = time.time()
    sr = 22050
    dummy = np.random.randn(sr * 2).astype(np.float32)  # 2s of noise
    extract_mfcc_features(dummy, sr)
    extract_spectral_features(dummy, sr)
    extract_formant_proxy_features(dummy, sr)
    logger.info("Warmup complete in %.2fs", time.time() - t0)


@app.on_event("startup")
async def startup_event():
    _warmup()


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "3002"))
    logger.info("Starting voice service on port %d (ffmpeg: %s)", port, HAS_FFMPEG)
    uvicorn.run(app, host="0.0.0.0", port=port)
