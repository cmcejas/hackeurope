#!/usr/bin/env python3
"""
Test script for voice analysis service
Generates a synthetic audio sample and tests the analysis pipeline
"""

import numpy as np
import soundfile as sf
import requests
import json
from pathlib import Path

def generate_test_audio(filename="test_audio.wav", duration=5.0, sample_rate=22050):
    """
    Generate a synthetic audio sample for testing
    Creates a simple tone with some harmonic content
    """
    print(f"Generating test audio: {duration}s @ {sample_rate}Hz")

    t = np.linspace(0, duration, int(sample_rate * duration))

    # Create a complex tone with harmonics (simulates speech-like characteristics)
    # Fundamental frequency around 150 Hz (typical male voice)
    fundamental = 150
    audio = (
        0.5 * np.sin(2 * np.pi * fundamental * t) +           # Fundamental
        0.3 * np.sin(2 * np.pi * fundamental * 2 * t) +       # 2nd harmonic
        0.2 * np.sin(2 * np.pi * fundamental * 3 * t) +       # 3rd harmonic
        0.1 * np.sin(2 * np.pi * fundamental * 4 * t)         # 4th harmonic
    )

    # Add some noise to simulate real recording
    noise = np.random.normal(0, 0.02, audio.shape)
    audio = audio + noise

    # Normalize
    audio = audio / np.max(np.abs(audio)) * 0.8

    # Save as WAV file
    sf.write(filename, audio, sample_rate)
    print(f"✓ Created {filename}")
    return filename


def test_voice_service(audio_file, service_url="http://localhost:3002"):
    """
    Test the voice analysis service with an audio file
    """
    print(f"\n--- Testing Voice Service at {service_url} ---")

    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{service_url}/health")
        response.raise_for_status()
        health_data = response.json()
        print(f"✓ Service is healthy: {json.dumps(health_data, indent=2)}")
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

    # Test analyze endpoint
    print(f"\n2. Testing analyze endpoint with {audio_file}...")
    try:
        with open(audio_file, 'rb') as f:
            files = {'audio': (audio_file, f, 'audio/wav')}
            response = requests.post(f"{service_url}/analyze", files=files)
            response.raise_for_status()
            analysis = response.json()

        print("✓ Analysis successful!")
        print("\n--- Analysis Results ---")
        print(f"Nasality Score: {analysis['nasality_score']}/100")
        print(f"Confidence: {analysis['confidence']}%")
        print(f"Suggests Congestion: {analysis['suggests_congestion']}")
        print(f"\nInterpretation:\n{analysis['interpretation']}")

        print("\n--- Key Features ---")
        features = analysis['features']
        print(f"Duration: {features['duration_seconds']}s")
        print(f"Sample Rate: {features['sample_rate']}Hz")

        if 'spectral' in features:
            spectral = features['spectral']
            print(f"\nSpectral Features:")
            print(f"  - Centroid: {spectral.get('spectral_centroid_mean', 'N/A'):.2f} Hz")
            print(f"  - Rolloff: {spectral.get('spectral_rolloff_mean', 'N/A'):.2f} Hz")
            print(f"  - Flatness: {spectral.get('spectral_flatness_mean', 'N/A'):.4f}")

        if 'formant_proxy' in features:
            formant = features['formant_proxy']
            print(f"\nFormant Proxy Features:")
            print(f"  - Low/High Ratio: {formant.get('low_to_high_ratio', 'N/A'):.2f}")
            print(f"  - Low Band Energy: {formant.get('low_band_energy', 'N/A'):.2f}")

        print("\n✓ All tests passed!")
        return True

    except requests.exceptions.ConnectionError:
        print(f"✗ Cannot connect to service at {service_url}")
        print("  Make sure the service is running:")
        print("  python main.py")
        return False
    except Exception as e:
        print(f"✗ Analysis failed: {e}")
        if hasattr(e, 'response'):
            print(f"Response: {e.response.text}")
        return False


def main():
    """Main test function"""
    print("=== Voice Analysis Service Test ===\n")

    # Generate test audio
    test_file = generate_test_audio()

    # Test the service
    success = test_voice_service(test_file)

    # Cleanup
    Path(test_file).unlink(missing_ok=True)
    print(f"\n✓ Cleaned up {test_file}")

    if success:
        print("\n✓✓✓ All tests passed! ✓✓✓")
        return 0
    else:
        print("\n✗✗✗ Some tests failed ✗✗✗")
        return 1


if __name__ == "__main__":
    exit(main())
