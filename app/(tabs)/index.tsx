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

function pickSentence(): string {
  return READ_ALOUD_SENTENCES[Math.floor(Math.random() * READ_ALOUD_SENTENCES.length)];
}

/* ── Step indicator dots ── */
function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.stepIndicator}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.stepDot, i === current && styles.stepDotActive]} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { cameraPermission, requestAll } = useHealthCheckPermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView>>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [step, setStep] = useState<Step>('menu');
  const [cameraReady, setCameraReady] = useState(false);
  const [eyePhotoBase64, setEyePhotoBase64] = useState<string | null>(null);
  const [readAloudSentence, setReadAloudSentence] = useState('');
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  /* ── Actions ── */

  const captureEyePhoto = async () => {
    const camera = cameraRef.current;
    if (!camera) {
      Alert.alert('Camera not ready', 'Please wait for the camera to load.');
      return;
    }
    try {
      const photo = await camera.takePictureAsync({ base64: true, imageType: 'jpg' });
      if (photo?.base64) {
        setEyePhotoBase64(photo.base64);
        setReadAloudSentence(pickSentence());
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
          if (uri.startsWith('content://') && FileSystem.cacheDirectory) {
            const dest = `${FileSystem.cacheDirectory}voice_upload.m4a`;
            await FileSystem.copyAsync({ from: uri, to: dest });
            readUri = dest;
          }
          voiceBase64 = await FileSystem.readAsStringAsync(readUri, { encoding: 'base64' });
        } catch (e) {
          console.warn('[runAnalysis] Could not read voice file:', uri, e);
          Alert.alert('Voice skipped', `Could not read the recording file. Analysis will proceed without voice.\n\n${e}`);
        }
      } else {
        console.warn('[runAnalysis] No voice URI — recording may not have saved');
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
      Alert.alert('Analysis failed', `${message}\n\nMake sure the backend is running.`);
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

  /* ═══════════════  CAMERA  ═══════════════ */
  if (step === 'camera') {
    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
          <Text style={styles.stepTitle}>Eye Photo</Text>
        </View>
        <StepDots current={0} />

        {cameraPermission?.granted ? (
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              onCameraReady={() => setCameraReady(true)}
            />
          </View>
        ) : (
          <View style={styles.permissionFailed}>
            <Text style={styles.permissionFailedText}>Camera permission not granted</Text>
          </View>
        )}

        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.pillButton, styles.pillSecondary]} onPress={reset}>
            <Text style={styles.pillText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={captureEyePhoto}
            disabled={!cameraReady}
            activeOpacity={0.7}
          >
            <View style={[styles.captureRing, !cameraReady && styles.pillDisabled]}>
              <View style={[styles.captureInner, !cameraReady && styles.captureInnerDisabled]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ═══════════════  RECORDING  ═══════════════ */
  if (step === 'recording') {
    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepLabel}>Step 2 of 2</Text>
          <Text style={styles.stepTitle}>Voice Sample</Text>
        </View>
        <StepDots current={1} />

        <View style={styles.recordingContainer}>
          <View style={[styles.micCircle, isRecording && styles.micCircleActive]}>
            <Text style={styles.micIcon}>{isRecording ? '🔴' : '🎙️'}</Text>
          </View>
          <Text style={styles.recordingLabel}>
            {isRecording ? 'Listening...' : 'Read aloud'}
          </Text>
          <Text style={styles.recordingHint}>
            We analyze your voice for signs of congestion or hoarseness.
          </Text>
          {readAloudSentence ? (
            <View style={styles.sentenceCard}>
              <Text style={styles.sentenceQuote}>Read this</Text>
              <Text style={styles.sentenceText}>"{readAloudSentence}"</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.pillButton, styles.pillSecondary]} onPress={reset}>
            <Text style={styles.pillText}>Cancel</Text>
          </TouchableOpacity>
          {!isRecording ? (
            <TouchableOpacity style={[styles.pillButton, styles.pillPrimary]} onPress={startRecording}>
              <Text style={styles.pillTextOnColor}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.pillButton, styles.pillDanger]} onPress={stopRecording}>
              <Text style={styles.pillTextOnColor}>Stop & Analyze</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  /* ═══════════════  ANALYZING  ═══════════════ */
  if (step === 'analyzing') {
    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepLabel}>Processing</Text>
          <Text style={styles.stepTitle}>Analyzing</Text>
        </View>
        <StepDots current={2} />

        <View style={styles.analyzingContainer}>
          {analysisError ? (
            <>
              <Text style={styles.errorText}>{analysisError}</Text>
              <View style={[styles.bottomBar, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
                <TouchableOpacity style={[styles.pillButton, styles.pillSecondary]} onPress={reset}>
                  <Text style={styles.pillText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillButton, styles.pillPrimary]}
                  onPress={() => {
                    setAnalysisError(null);
                    runAnalysis(voiceUri ?? undefined);
                  }}
                >
                  <Text style={styles.pillTextOnColor}>Retry</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.analyzingText}>Analyzing with AI...</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  /* ═══════════════  RESULTS  ═══════════════ */
  if (step === 'results' && analysisResult) {
    const prob = analysisResult.sicknessProbability ?? 0;
    const sevColor = getSeverityColor(prob);

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Results</Text>
          </View>

          {/* Probability ring */}
          <View style={styles.resultRingContainer}>
            <View style={[styles.resultRingOuter, { borderColor: sevColor }]}>
              <Text style={[styles.resultPercentage, { color: sevColor }]}>
                {prob}
                <Text style={styles.resultPercentSign}>%</Text>
              </Text>
            </View>
            <View style={[styles.resultSeverityPill, { backgroundColor: `${sevColor}20` }]}>
              <Text style={[styles.resultSeverityText, { color: sevColor }]}>
                {analysisResult.severity ?? 'unknown'}
              </Text>
            </View>
          </View>

          {/* Symptoms */}
          {analysisResult.symptoms && analysisResult.symptoms.length > 0 && (
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultCardIcon}>🔍</Text>
                <Text style={styles.resultCardTitle}>Detected Symptoms</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {analysisResult.symptoms.map((s, i) => (
                  <View key={i} style={styles.symptomChip}>
                    <Text style={styles.symptomChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Eye analysis */}
          {analysisResult.eyeAnalysis && (
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultCardIcon}>👁️</Text>
                <Text style={styles.resultCardTitle}>Eye Analysis</Text>
              </View>
              <Text style={styles.resultCardBody}>{analysisResult.eyeAnalysis}</Text>
            </View>
          )}

          {/* Environmental */}
          {analysisResult.environmentalFactors && (
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultCardIcon}>🌿</Text>
                <Text style={styles.resultCardTitle}>Environmental Factors</Text>
              </View>
              <Text style={styles.resultCardBody}>{analysisResult.environmentalFactors}</Text>
            </View>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations && (
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultCardIcon}>💡</Text>
                <Text style={styles.resultCardTitle}>Recommendations</Text>
              </View>
              <Text style={styles.resultCardBody}>{analysisResult.recommendations}</Text>
            </View>
          )}

          {/* Doctor warning */}
          {analysisResult.shouldSeeDoctor && (
            <View style={styles.doctorBanner}>
              <Text style={styles.doctorBannerIcon}>⚠️</Text>
              <Text style={styles.doctorBannerText}>
                Based on these results, we recommend consulting a healthcare professional.
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.ctaButton} onPress={reset}>
            <Text style={styles.ctaButtonText}>Start New Check</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  /* ═══════════════  MENU  ═══════════════ */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Health Check</Text>
          <Text style={styles.heroSubtitle}>
            Quick AI-powered screening using your camera, voice, and local pollen data.
          </Text>
        </View>

        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
              <Text style={{ fontSize: 22 }}>👁️</Text>
            </View>
            <View style={styles.featureCardContent}>
              <Text style={styles.featureCardTitle}>Eye Scan</Text>
              <Text style={styles.featureCardDesc}>Checks redness, puffiness, and discoloration</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,159,10,0.15)' }]}>
              <Text style={{ fontSize: 22 }}>🎙️</Text>
            </View>
            <View style={styles.featureCardContent}>
              <Text style={styles.featureCardTitle}>Voice Analysis</Text>
              <Text style={styles.featureCardDesc}>Detects congestion, hoarseness, and strain</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
              <Text style={{ fontSize: 22 }}>🌿</Text>
            </View>
            <View style={styles.featureCardContent}>
              <Text style={styles.featureCardTitle}>Pollen Report</Text>
              <Text style={styles.featureCardDesc}>Local allergen levels from your area</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={startCheck} activeOpacity={0.8}>
          <Text style={styles.ctaButtonText}>Begin Health Check</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
