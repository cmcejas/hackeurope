import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  useWindowDimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

import { useHealthCheckPermissions } from '../../hooks/useHealthCheckPermissions';
import { analyzeHealth, checkBackend, saveResultToHistory } from '../../lib/api';
import type { AnalysisResult, Step } from '../../lib/types';
import { colors, getSeverityColor, contentMaxWidth, radii } from './theme';
import { styles } from './index.styles';
import { GradientBackground } from './GradientBackground';
import { GlassCard } from './GlassCard';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
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
  const [allergyHistoryText, setAllergyHistoryText] = useState('');
  const [tileIndex, setTileIndex] = useState(0);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [saveHistoryError, setSaveHistoryError] = useState<string | null>(null);
  const [savingToHistory, setSavingToHistory] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth, contentMaxWidth);
  const router = useRouter();

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
      // Fallback: Trinity College Dublin (College Green)
      let lat = 53.343792;
      let lon = -6.254492;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy?.Highest ?? 5 });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // use fallback
      }

      const uri = finalVoiceUri ?? voiceUri ?? null;
      let voiceBase64: string | null = null;
      let voiceMediaType = 'audio/m4a';
      if (uri) {
        try {
          if (Platform.OS === 'web' && uri.startsWith('blob:')) {
            // Web: expo-av returns blob: URLs that FileSystem can't read.
            // Fetch the blob and convert to base64 via FileReader.
            const blob = await fetch(uri).then((r) => r.blob());
            if (blob.type) voiceMediaType = blob.type;
            voiceBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const b64 = dataUrl.split(',')[1];
                if (b64) resolve(b64);
                else reject(new Error('FileReader produced empty base64'));
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });
            console.log('[runAnalysis] Web blob read OK, type:', voiceMediaType, 'base64 length:', voiceBase64.length);
          } else {
            // Native (iOS/Android): use FileSystem
            let readUri = uri;
            if (uri.startsWith('content://') && FileSystem.cacheDirectory) {
              const dest = `${FileSystem.cacheDirectory}voice_upload_${Date.now()}.m4a`;
              try {
                await FileSystem.copyAsync({ from: uri, to: dest });
                readUri = dest;
              } catch (copyErr) {
                console.warn('[runAnalysis] Copy content:// to cache failed, trying direct read:', copyErr);
              }
            }
            voiceBase64 = await FileSystem.readAsStringAsync(readUri, { encoding: 'base64' });
          }
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
        voiceMediaType,
        latitude: lat,
        longitude: lon,
        allergyHistory: allergyHistoryText.trim() || undefined,
        userId: user?.id || null,
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
    setAllergyHistoryText('');
    setSavedToHistory(false);
    setSaveHistoryError(null);
  };

  const handleSaveToHistory = async () => {
    if (!user?.id || !analysisResult || savingToHistory) return;
    setSavingToHistory(true);
    setSaveHistoryError(null);
    try {
      await saveResultToHistory(user.id, analysisResult);
      setSavedToHistory(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setSaveHistoryError(msg);
      Alert.alert('Save failed', msg);
    } finally {
      setSavingToHistory(false);
    }
  };

  const onTilesScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / contentWidth);
    setTileIndex(Math.min(2, Math.max(0, index)));
  };

  /* ═══════════════  CAMERA  ═══════════════ */
  if (step === 'camera') {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.contentWrap}>
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
      </View>
    );
  }

  /* ═══════════════  RECORDING  ═══════════════ */
  if (step === 'recording') {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.contentWrap}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepLabel}>Step 2 of 2</Text>
            <Text style={styles.stepTitle}>Voice Sample</Text>
          </View>
          <StepDots current={1} />

          <View style={styles.recordingContainer}>
          <View style={[styles.micCircle, isRecording && styles.micCircleActive]}>
            <Ionicons
              name={isRecording ? 'radio-button-on' : 'mic'}
              size={40}
              color={isRecording ? colors.danger : colors.text}
            />
          </View>
          <Text style={styles.recordingLabel}>
            {isRecording ? 'Listening...' : 'Read aloud'}
          </Text>
          <Text style={styles.recordingHint}>
            We analyze your voice for signs of congestion or hoarseness.
          </Text>
          {readAloudSentence ? (
            <GlassCard style={styles.sentenceCard} innerStyle={{ padding: 20 }}>
              <Text style={styles.sentenceQuote}>Read this</Text>
              <Text style={styles.sentenceText}>"{readAloudSentence}"</Text>
            </GlassCard>
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
      </View>
    );
  }

  /* ═══════════════  ANALYZING  ═══════════════ */
  if (step === 'analyzing') {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.contentWrap}>
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
      </View>
    );
  }

  /* ═══════════════  RESULTS  ═══════════════ */
  if (step === 'results' && analysisResult) {
    const prob = analysisResult.sicknessProbability ?? 0;
    const sevColor = getSeverityColor(prob);

    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.contentWrap}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
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
            <Text style={[styles.resultSeveritySubtext, { color: sevColor }]}>
              {prob}% chance of being sick, likely {analysisResult.severity ?? 'unknown'}.
            </Text>
            <View style={[styles.resultSeverityPill, { backgroundColor: `${sevColor}20` }]}>
              <Text style={[styles.resultSeverityText, { color: sevColor }]}>
                {analysisResult.severity ?? 'unknown'}
              </Text>
            </View>
          </View>

          {/* Allergy: only show when sickness is non-trivial and allergy % is consistent */}
          {(() => {
            const sick = analysisResult.sicknessProbability ?? 0;
            const allergy = analysisResult.allergyProbability ?? 0;
            const showAllergy = sick >= 15 && allergy > 0 && allergy <= sick;
            if (!showAllergy) return null;
            return (
              <GlassCard style={styles.resultCard} innerStyle={styles.resultCardInner}>
                <View style={styles.resultCardHeader}>
                  <Ionicons name="medical-outline" size={18} color={colors.text} />
                  <Text style={styles.resultCardTitle}>Allergy</Text>
                </View>
                <Text style={styles.resultCardBody}>
                  {allergy}% chance that the symptoms are allergy-related (e.g. pollen).
                </Text>
              </GlassCard>
            );
          })()}

          {/* Symptoms */}
          {analysisResult.symptoms && analysisResult.symptoms.length > 0 && (
            <GlassCard style={styles.resultCard} innerStyle={styles.resultCardInner}>
              <View style={styles.resultCardHeader}>
                <Ionicons name="search-outline" size={18} color={colors.text} />
                <Text style={styles.resultCardTitle}>Detected Symptoms</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {analysisResult.symptoms.map((s, i) => (
                  <View key={i} style={styles.symptomChip}>
                    <Text style={styles.symptomChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Eye analysis */}
          {analysisResult.eyeAnalysis && (
            <GlassCard style={styles.resultCard} innerStyle={styles.resultCardInner}>
              <View style={styles.resultCardHeader}>
                <Ionicons name="eye-outline" size={18} color={colors.text} />
                <Text style={styles.resultCardTitle}>Eye Analysis</Text>
              </View>
              <Text style={styles.resultCardBody}>
                {analysisResult.eyeAnalysis.split(/(\bredness\b|\bredness detected\b|\bdischarge\b|\btearing\b|\bswelling\b|\bswollen\b|\binflammation\b|\bconjunctivitis\b|\bunilateral\b|\bbilateral\b|\bnormal\b|\bclear\b|\bhealthy\b)/gi).map((part, i) => {
                  const isHighlight = /^(redness|redness detected|discharge|tearing|swelling|swollen|inflammation|conjunctivitis|unilateral|bilateral|normal|clear|healthy)$/i.test(part);
                  return isHighlight ? (
                    <Text key={i} style={styles.highlightedKeyword}>{part}</Text>
                  ) : (
                    <Text key={i}>{part}</Text>
                  );
                })}
              </Text>
            </GlassCard>
          )}

          {/* Voice analysis — right after eye analysis (always show a voice section) */}
          {analysisResult.voice && !analysisResult.voice.error ? (
            <GlassCard style={styles.resultCard} innerStyle={styles.resultCardInner}>
              <View style={styles.resultCardHeader}>
                <Ionicons name="mic-outline" size={18} color={colors.text} />
                <Text style={styles.resultCardTitle}>Voice Analysis</Text>
              </View>

              {/* Main interpretation with highlights */}
              <Text style={styles.resultCardBody}>
                {analysisResult.voice.interpretation.split(/(\bhigh nasality\b|\bmoderate nasality\b|\bmild nasality\b|\blow nasality\b|\bnasal congestion\b|\bcongestion\b|\ballergic rhinitis\b|\bnormal\b|\bnasal quality\b)/gi).map((part, i) => {
                  const isHighlight = /^(high nasality|moderate nasality|mild nasality|low nasality|nasal congestion|congestion|allergic rhinitis|normal|nasal quality)$/i.test(part);
                  return isHighlight ? (
                    <Text key={i} style={styles.highlightedKeyword}>{part}</Text>
                  ) : (
                    <Text key={i}>{part}</Text>
                  );
                })}
              </Text>

              {/* Key Metrics */}
              <View style={styles.voiceMetricsContainer}>
                <View style={styles.voiceMetricBox}>
                  <Text style={styles.voiceMetricLabel}>Nasality Score</Text>
                  <Text style={styles.voiceMetricValue}>
                    {Math.round(analysisResult.voice.nasality_score)}/100
                  </Text>
                </View>
                <View style={styles.voiceMetricBox}>
                  <Text style={styles.voiceMetricLabel}>Confidence</Text>
                  <Text style={styles.voiceMetricValue}>
                    {Math.round(analysisResult.voice.confidence)}%
                  </Text>
                </View>
                <View style={styles.voiceMetricBox}>
                  <Text style={styles.voiceMetricLabel}>Duration</Text>
                  <Text style={styles.voiceMetricValue}>
                    {analysisResult.voice.features?.duration_seconds?.toFixed(1)}s
                  </Text>
                </View>
              </View>

              {/* Detailed Statistics */}
              {analysisResult.voice.features && (
                <View style={styles.voiceStatsContainer}>
                  <Text style={styles.voiceStatsTitle}>Acoustic Analysis</Text>

                  {/* Spectral Features */}
                  <View style={styles.voiceStatRow}>
                    <Text style={styles.voiceStatLabel}>Voice Frequency Center</Text>
                    <Text style={styles.voiceStatValue}>
                      {Math.round(analysisResult.voice.features.spectral?.spectral_centroid_mean || 0)} Hz
                    </Text>
                  </View>
                  <Text style={styles.voiceStatDescription}>
                    {(() => {
                      const centroid = analysisResult.voice.features.spectral?.spectral_centroid_mean || 0;
                      if (centroid < 2000) return '🔴 Lower than normal - indicates nasal resonance';
                      if (centroid < 2500) return '🟡 Slightly lower - mild nasal quality';
                      return '🟢 Normal range - clear voice';
                    })()}
                  </Text>

                  <View style={styles.voiceStatRow}>
                    <Text style={styles.voiceStatLabel}>Low/High Frequency Ratio</Text>
                    <Text style={styles.voiceStatValue}>
                      {analysisResult.voice.features.formant_proxy?.low_to_high_ratio?.toFixed(2) || 'N/A'}
                    </Text>
                  </View>
                  <Text style={styles.voiceStatDescription}>
                    {(() => {
                      const ratio = analysisResult.voice.features.formant_proxy?.low_to_high_ratio || 0;
                      if (ratio > 2.0) return '🔴 High ratio - strong nasal congestion signature';
                      if (ratio > 1.5) return '🟡 Elevated - moderate congestion possible';
                      return '🟢 Normal - balanced frequency distribution';
                    })()}
                  </Text>

                  <View style={styles.voiceStatRow}>
                    <Text style={styles.voiceStatLabel}>Spectral Rolloff</Text>
                    <Text style={styles.voiceStatValue}>
                      {Math.round(analysisResult.voice.features.spectral?.spectral_rolloff_mean || 0)} Hz
                    </Text>
                  </View>
                  <Text style={styles.voiceStatDescription}>
                    {(() => {
                      const rolloff = analysisResult.voice.features.spectral?.spectral_rolloff_mean || 0;
                      if (rolloff < 4000) return '🔴 Low - energy concentrated in lower frequencies';
                      if (rolloff < 5000) return '🟡 Moderate - some nasal characteristics';
                      return '🟢 Normal - full frequency range';
                    })()}
                  </Text>

                  <View style={styles.voiceStatRow}>
                    <Text style={styles.voiceStatLabel}>Low Band Energy</Text>
                    <Text style={styles.voiceStatValue}>
                      {Math.round(analysisResult.voice.features.formant_proxy?.low_band_energy || 0)}
                    </Text>
                  </View>
                  <Text style={styles.voiceStatDescription}>
                    {(() => {
                      const energy = analysisResult.voice.features.formant_proxy?.low_band_energy || 0;
                      if (energy > 30) return '🔴 High - strong nasal resonance detected';
                      if (energy > 20) return '🟡 Elevated - some nasal quality';
                      return '🟢 Normal - typical voice characteristics';
                    })()}
                  </Text>

                  <View style={styles.voiceStatRow}>
                    <Text style={styles.voiceStatLabel}>Sample Rate</Text>
                    <Text style={styles.voiceStatValue}>
                      {(analysisResult.voice.features.sample_rate / 1000).toFixed(1)} kHz
                    </Text>
                  </View>
                </View>
              )}

              {/* Congestion indicator */}
              {analysisResult.voice.suggests_congestion && (
                <View style={styles.voiceCongestionBadge}>
                  <Ionicons name="water-outline" size={16} color="#ff6b6b" />
                  <Text style={styles.voiceCongestionText}>Nasal congestion detected</Text>
                </View>
              )}
            </GlassCard>
          ) : (
            <GlassCard style={styles.resultCard} innerStyle={styles.resultCardInner}>
              <View style={styles.resultCardHeader}>
                <Ionicons name="mic-outline" size={18} color={colors.text} />
                <Text style={styles.resultCardTitle}>Voice Analysis</Text>
              </View>
              <Text style={styles.resultCardBody}>
                {analysisResult.voice?.error
                  ? /Voice service unavailable|Voice analysis failed|not available/i.test(analysisResult.voice.error)
                    ? "Voice analysis isn't running for this environment. Your recording was received but couldn't be analyzed. Eye and environmental results are still complete."
                    : `Voice analysis unavailable: ${analysisResult.voice.error}`
                  : 'No voice recording was provided for this check.'}
              </Text>
            </GlassCard>
          )}

          {/* Location + pollen (title = actual place when available) */}
          {analysisResult.environmentalFactors && (
            <GlassCard style={styles.resultCard} innerStyle={styles.resultCardInner}>
              <View style={styles.resultCardHeader}>
                <Ionicons name="leaf-outline" size={18} color={colors.text} />
                <Text style={styles.resultCardTitle}>
                  {analysisResult.location?.displayName ?? 'In your area'}
                </Text>
              </View>
              <Text style={styles.resultCardBody}>
                {(() => {
                  const text = analysisResult.location?.displayName
                    ? analysisResult.environmentalFactors!.replace(/^./, (c) => c.toLowerCase())
                    : `In your area, ${analysisResult.environmentalFactors!.replace(/^./, (c) => c.toLowerCase())}`;
                  return text.split(/(\bpollen\b|\bhigh\b|\bmoderate\b|\blow\b|\bgrass\b|\btree\b|\bweed\b|\bragweed\b|\birritant\b|\bair quality\b|\bhumidity\b|\bwind\b|\bmold\b|\bdust\b|\bsevere\b|\belevated\b)/gi).map((part, i) => {
                    const isHighlight = /^(pollen|high|moderate|low|grass|tree|weed|ragweed|irritant|air quality|humidity|wind|mold|dust|severe|elevated)$/i.test(part);
                    return isHighlight ? (
                      <Text key={i} style={styles.highlightedKeyword}>{part}</Text>
                    ) : (
                      <Text key={i}>{part}</Text>
                    );
                  });
                })()}
              </Text>
            </GlassCard>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations && (
            <GlassCard style={styles.resultCard} innerStyle={styles.resultCardInner}>
              <View style={styles.resultCardHeader}>
                <Ionicons name="bulb-outline" size={18} color={colors.text} />
                <Text style={styles.resultCardTitle}>Recommendations</Text>
              </View>
              <Text style={styles.resultCardBody}>
                {analysisResult.recommendations.split(/(\bavoid\b|\bconsult\b|\bseek medical\b|\bantihistamine\b|\beye drops\b|\bindoor\b|\bmedication\b|\bmonitor\b|\brinse\b|\bwash hands\b|\bsunglasses\b|\bpollen\b|\bdoctor\b|\bspecialist\b|\burgent\b|\bimmediate\b)/gi).map((part, i) => {
                  const isHighlight = /^(avoid|consult|seek medical|antihistamine|eye drops|indoor|medication|monitor|rinse|wash hands|sunglasses|pollen|doctor|specialist|urgent|immediate)$/i.test(part);
                  return isHighlight ? (
                    <Text key={i} style={styles.highlightedKeyword}>{part}</Text>
                  ) : (
                    <Text key={i}>{part}</Text>
                  );
                })}
              </Text>
            </GlassCard>
          )}

          {/* Doctor warning */}
          {analysisResult.shouldSeeDoctor && (
            <View style={styles.doctorBanner}>
              <Ionicons name="warning" size={24} color={colors.danger} />
              <Text style={styles.doctorBannerText}>
                {analysisResult.isUnilateral
                  ? 'Unilateral redness detected — please seek urgent medical attention.'
                  : 'Based on these results, we recommend consulting a healthcare professional.'}
              </Text>
            </View>
          )}

          {/* Save to history — explicit save with feedback */}
          {user ? (
            savedToHistory ? (
              <View style={[styles.ctaButton, styles.saveHistoryDone]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={[styles.pillText, { color: colors.success }]}>Saved to history</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.ctaButton, styles.pillSecondary, { marginBottom: 12 }]}
                onPress={handleSaveToHistory}
                disabled={savingToHistory}
                activeOpacity={0.8}
              >
                {savingToHistory ? (
                  <>
                    <ActivityIndicator size="small" color={colors.text} />
                    <Text style={styles.pillText}>Saving…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="bookmark-outline" size={20} color={colors.text} />
                    <Text style={styles.pillText}>Save to history</Text>
                  </>
                )}
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={[styles.ctaButton, styles.pillSecondary, { marginBottom: 12 }]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={styles.pillText}>Log in to save to history</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.ctaButton} onPress={reset}>
            <Text style={styles.ctaButtonText}>Start New Check</Text>
          </TouchableOpacity>
        </ScrollView>
        </View>
      </View>
    );
  }

  /* ═══════════════  MENU  ═══════════════ */
  const TILES = [
    {
      icon: 'eye-outline' as const,
      title: 'Eye Scan',
      desc: 'We check your eyes for redness, puffiness, and discoloration using your camera.',
      iconBg: colors.primaryMuted,
      iconColor: colors.primary,
    },
    {
      icon: 'mic-outline' as const,
      title: 'Voice Analysis',
      desc: 'A short voice sample helps us detect congestion, hoarseness, or strain.',
      iconBg: colors.primaryMuted,
      iconColor: colors.primary,
    },
    {
      icon: 'leaf-outline' as const,
      title: 'Pollen & area',
      desc: 'Local allergen levels from your area are included in your assessment.',
      iconBg: colors.successMuted,
      iconColor: colors.success,
    },
  ];

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={styles.contentWrap}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.heroSection}>
          <View style={styles.heroTopRow}>
            <View style={styles.logoRow}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>PollenCast</Text>
            </View>
            <TouchableOpacity
              style={styles.profileLink}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.profileLinkText}>Profile</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSubtitle}>
            Quick AI-powered screening using your camera, voice, and local pollen data.
          </Text>
        </View>

        {/* Swipeable onboarding tiles */}
        <View style={styles.tileCarouselWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onTilesScroll}
            scrollEventThrottle={32}
            decelerationRate="fast"
            contentContainerStyle={styles.tileCarouselContent}
            style={[styles.tileCarousel, { width: contentWidth }]}
          >
            {TILES.map((tile) => (
              <View key={tile.title} style={[styles.tileCard, { width: contentWidth }]}>
                <GlassCard style={styles.tileCardInner}>
                  <View style={[styles.tileIcon, { backgroundColor: tile.iconBg }]}>
                    <Ionicons name={tile.icon} size={28} color={tile.iconColor} />
                  </View>
                  <Text style={styles.tileTitle}>{tile.title}</Text>
                  <Text style={styles.tileDesc}>{tile.desc}</Text>
                </GlassCard>
              </View>
            ))}
          </ScrollView>
          <View style={styles.tilePagination}>
            {TILES.map((_, i) => (
              <View
                key={i}
                style={[styles.tileDot, i === tileIndex && styles.tileDotActive]}
              />
            ))}
          </View>
        </View>

        {/* Allergy / symptom history (optional) */}
        <View style={styles.allergySection}>
          <Text style={styles.allergyLabel}>Allergy & symptom history (optional)</Text>
          <Text style={styles.allergyHint}>
            E.g. hay fever, itchy eyes in spring, asthma, known allergens. This is sent to the AI to improve your assessment.
          </Text>
          <GlassCard innerStyle={{ padding: 14, borderRadius: radii.md }}>
            <TextInput
              style={[styles.allergyInput, { borderWidth: 0 }]}
              placeholder="e.g. Pollen allergy, itchy eyes in summer, allergic to grass..."
              placeholderTextColor={colors.textTertiary}
              value={allergyHistoryText}
              onChangeText={setAllergyHistoryText}
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
          </GlassCard>
          {allergyHistoryText.length > 0 && (
            <Text style={styles.allergyCharCount}>{allergyHistoryText.length}/500</Text>
          )}
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={startCheck} activeOpacity={0.8}>
          <Text style={styles.ctaButtonText}>Begin Health Check</Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </View>
  );
}
