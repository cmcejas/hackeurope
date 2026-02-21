import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

import { useHealthCheckPermissions } from '../../hooks/useHealthCheckPermissions';
import { analyzeHealth, checkBackend } from '../../lib/api';
import type { AnalysisResult, Step } from '../../lib/types';

export default function HomeScreen() {
  const { cameraPermission, requestAll } = useHealthCheckPermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView>>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [step, setStep] = useState<Step>('menu');
  const [cameraReady, setCameraReady] = useState(false);
  const [eyePhotoBase64, setEyePhotoBase64] = useState<string | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const captureEyePhoto = async () => {
    const camera = cameraRef.current;
    if (!camera) {
      Alert.alert('Camera not ready', 'Please wait for the camera to load.');
      return;
    }
    try {
      const photo = await camera.takePictureAsync({
        base64: true,
        imageType: 'jpg',
      });
      if (photo?.base64) {
        setEyePhotoBase64(photo.base64);
        setStep('recording');
      } else {
        Alert.alert('Error', 'Failed to capture photo');
      }
    } catch (err) {
      console.warn('Capture error:', err);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setVoiceUri(uri ?? null);
      setIsRecording(false);
      setStep('analyzing');
      await runAnalysis(uri ?? undefined);
    } catch {
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
    }
  };

  const runAnalysis = async (finalVoiceUri?: string) => {
    if (!eyePhotoBase64) {
      setStep('menu');
      return;
    }
    try {
      let lat = 37.7749;
      let lon = -122.4194;
      try {
        const pos = await Location.getCurrentPositionAsync({});
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // use defaults
      }

      const result = await analyzeHealth({
        imageBase64: eyePhotoBase64,
        imageMediaType: 'image/jpeg',
        voiceUri: finalVoiceUri ?? voiceUri ?? null,
        latitude: lat,
        longitude: lon,
      });
      setAnalysisError(null);
      setAnalysisResult(result);
      setStep('results');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setAnalysisError(message);
      Alert.alert(
        'Analysis failed',
        `${message} On this computer, start the backend in another terminal: cd backend && npm run dev`
      );
    }
  };

  const startCheck = async () => {
    const backend = await checkBackend();
    if (!backend.ok) {
      Alert.alert(
        'Backend not reachable',
        `${backend.message}\n\nStart it in a terminal:\ncd backend && npm run dev`
      );
      return;
    }
    const ok = await requestAll();
    if (ok) setStep('camera');
  };

  const reset = () => {
    setStep('menu');
    setCameraReady(false);
    setEyePhotoBase64(null);
    setVoiceUri(null);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  // —— Steps ——

  if (step === 'camera') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Step 1: Take Eye Photo</Text>
        </View>
        {cameraPermission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            onCameraReady={() => setCameraReady(true)}
          />
        ) : (
          <View style={styles.permissionFailed}>
            <Text>Camera permission not granted</Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={reset}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonCapture, !cameraReady && styles.buttonDisabled]}
            onPress={captureEyePhoto}
            disabled={!cameraReady}
          >
            <Text style={styles.buttonText}>{cameraReady ? 'Capture' : 'Loading…'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'recording') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Step 2: Record Voice</Text>
        </View>
        <View style={styles.recordingContainer}>
          <Text style={styles.recordingText}>
            {isRecording ? '🔴 Recording...' : 'Ready to record'}
          </Text>
          <Text style={styles.instructionText}>Describe how you are feeling</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCancel]}
            onPress={() => {
              reset();
            }}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          {!isRecording ? (
            <TouchableOpacity style={[styles.button, styles.buttonRecord]} onPress={startRecording}>
              <Text style={styles.buttonText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, styles.buttonStop]} onPress={stopRecording}>
              <Text style={styles.buttonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (step === 'analyzing') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Analyzing Your Health</Text>
        </View>
        <View style={styles.analyzingContainer}>
          {analysisError ? (
            <>
              <Text style={styles.errorText}>{analysisError}</Text>
              <Text style={styles.analyzingText}>
                On this computer: start the backend (cd backend && npm run dev).
                On a phone: set EXPO_PUBLIC_API_URL to your computer IP in .env.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={reset}
                >
                  <Text style={styles.buttonText}>Back to start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonStart]}
                  onPress={() => {
                    setAnalysisError(null);
                    runAnalysis(voiceUri ?? undefined);
                  }}
                >
                  <Text style={styles.buttonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.analyzingText}>Processing with Gemini...</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  if (step === 'results' && analysisResult) {
    const prob = analysisResult.sicknessProbability ?? 0;
    const severityColor =
      prob < 30 ? '#34C759' : prob < 60 ? '#FF9500' : '#FF3B30';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Health Assessment</Text>
          </View>

          <View style={[styles.resultBox, { borderLeftColor: severityColor }]}>
            <Text style={styles.resultLabel}>Sickness Probability</Text>
            <Text style={[styles.probabilityText, { color: severityColor }]}>{prob}%</Text>
            <Text style={styles.severityText}>
              Severity: {analysisResult.severity ?? '—'}
            </Text>
          </View>

          {analysisResult.symptoms && analysisResult.symptoms.length > 0 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🔍 Detected Symptoms</Text>
              {analysisResult.symptoms.map((s, i) => (
                <Text key={i} style={styles.symptomText}>• {s}</Text>
              ))}
            </View>
          )}

          {analysisResult.eyeAnalysis && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>👁️ Eye Analysis</Text>
              <Text style={styles.infoText}>{analysisResult.eyeAnalysis}</Text>
            </View>
          )}

          {analysisResult.environmentalFactors && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🌍 Environmental Factors</Text>
              <Text style={styles.infoText}>{analysisResult.environmentalFactors}</Text>
            </View>
          )}

          {analysisResult.recommendations && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💊 Recommendations</Text>
              <Text style={styles.infoText}>{analysisResult.recommendations}</Text>
            </View>
          )}

          {analysisResult.shouldSeeDoctor && (
            <View style={[styles.infoBox, { borderLeftColor: '#FF3B30' }]}>
              <Text style={[styles.infoTitle, { color: '#FF3B30' }]}>⚠️ Important</Text>
              <Text style={[styles.infoText, { color: '#FF3B30' }]}>
                Please consult a doctor
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={reset}>
            <Text style={styles.buttonText}>Start New Check</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Menu
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Health Check</Text>
          <Text style={styles.subtitle}>Are you feeling sick?</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📸 Eye Analysis</Text>
          <Text style={styles.infoText}>We will analyze your eyes for signs of illness</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🎤 Voice Analysis</Text>
          <Text style={styles.infoText}>We will use your voice for symptom context</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🌍 Pollen Data</Text>
          <Text style={styles.infoText}>We will check local pollen levels</Text>
        </View>

        <TouchableOpacity style={[styles.button, styles.buttonStart]} onPress={startCheck}>
          <Text style={styles.buttonText}>Start Health Check</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  probabilityText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  severityText: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  symptomText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  permissionFailed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    marginTop: 20,
  },
  buttonCapture: {
    backgroundColor: '#34C759',
  },
  buttonRecord: {
    backgroundColor: '#007AFF',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonCancel: {
    backgroundColor: '#999',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  recordingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  analyzingText: {
    fontSize: 18,
    marginTop: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
});
