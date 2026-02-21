import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

import { useHealthCheckPermissions } from '../../hooks/useHealthCheckPermissions';
import { analyzeHealth, checkBackend } from '../../lib/api';
import type { AnalysisResult, Step } from '../../lib/types';
import { colors, getSeverityColor } from './theme';
import { styles } from './index.styles';

const READ_ALOUD_SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'She sells seashells by the seashore.',
  'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
  'The sky is clear and the sun is bright today.',
  'Please read this sentence in your normal speaking voice.',
  'Pack my box with five dozen liquor jugs.',
  'The five boxing wizards jump quickly.',
];

function getRandomReadAloudSentence(): string {
  return READ_ALOUD_SENTENCES[Math.floor(Math.random() * READ_ALOUD_SENTENCES.length)];
}

export default function HomeScreen() {
  const { cameraPermission, requestAll } = useHealthCheckPermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView>>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [step, setStep] = useState<Step>('menu');
  const [cameraReady, setCameraReady] = useState(false);
  const [eyePhotoBase64, setEyePhotoBase64] = useState<string | null>(null);
  const [readAloudSentence, setReadAloudSentence] = useState<string>('');
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
        setReadAloudSentence(getRandomReadAloudSentence());
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
    const recording = recordingRef.current;
    recordingRef.current = null;
    setIsRecording(false);
    setStep('analyzing');
    try {
      await recording.stopAndUnloadAsync();
      // Give the filesystem a moment to flush the recording before reading the URI
      await new Promise((r) => setTimeout(r, 400));
      const uri = recording.getURI();
      setVoiceUri(uri ?? null);
      await runAnalysis(uri ?? undefined);
    } catch {
      Alert.alert('Error', 'Failed to stop recording');
      await runAnalysis(undefined);
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

      const uri = finalVoiceUri ?? voiceUri ?? null;
      let voiceBase64: string | null = null;
      if (uri) {
        try {
          let readUri = uri;
          // On Android, expo-av may return content://; expo-file-system reads file:// or needs a copy
          if (uri.startsWith('content://') && FileSystem.cacheDirectory) {
            const dest = `${FileSystem.cacheDirectory}voice_upload.m4a`;
            await FileSystem.copyAsync({ from: uri, to: dest });
            readUri = dest;
          }
          voiceBase64 = await FileSystem.readAsStringAsync(readUri, {
            encoding: 'base64',
          });
          if (__DEV__) console.log('[runAnalysis] voice loaded, length:', voiceBase64?.length ?? 0);
        } catch (e) {
          if (__DEV__) console.warn('[runAnalysis] Could not read voice file:', uri?.slice(0, 60), e);
        }
      } else if (__DEV__) {
        console.log('[runAnalysis] No voice URI (getURI() may have returned undefined)');
      }

      const result = await analyzeHealth({
        imageBase64: eyePhotoBase64,
        imageMediaType: 'image/jpeg',
        voiceBase64,
        voiceMediaType: 'audio/m4a',
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
    setReadAloudSentence('');
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
            {isRecording ? '🔴 Recording...' : 'Read this sentence aloud'}
          </Text>
          <Text style={styles.instructionText}>
            We'll analyze how you sound (e.g. congestion, hoarseness).
          </Text>
          {readAloudSentence ? (
            <View style={styles.sentenceBox}>
              <Text style={styles.sentenceText}>"{readAloudSentence}"</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCancel]}
            onPress={reset}
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
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.analyzingText}>Processing with Gemini...</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  if (step === 'results' && analysisResult) {
    const prob = analysisResult.sicknessProbability ?? 0;
    const severityColor = getSeverityColor(prob);

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Health Assessment</Text>
          </View>

          <View style={[styles.resultBox, { borderLeftColor: severityColor }]}>
            <Text style={styles.resultLabel}>Sickness Probability</Text>
            <Text style={[styles.probabilityText, { color: severityColor }]}>
              {prob}%
            </Text>
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
            <View style={[styles.infoBox, { borderLeftColor: colors.danger }]}>
              <Text style={[styles.infoTitle, { color: colors.danger }]}>
                ⚠️ Important
              </Text>
              <Text style={[styles.infoText, { color: colors.danger }]}>
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
          <Text style={styles.infoText}>Read a sentence aloud; we analyze how you sound (e.g. congestion, hoarseness)</Text>
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
