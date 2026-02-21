/** Voice analysis result from librosa microservice */
export interface VoiceAnalysis {
  nasality_score: number;
  confidence: number;
  interpretation: string;
  suggests_congestion: boolean;
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
  error?: string;
}

/** Health assessment result from backend */
export interface AnalysisResult {
  sicknessProbability: number;
  allergyProbability?: number;
  symptoms?: string[];
  eyeAnalysis?: string;
  environmentalFactors?: string;
  recommendations?: string;
  severity?: string;
  shouldSeeDoctor?: boolean;
  isUnilateral?: boolean;
  dischargeType?: string;
  voice?: VoiceAnalysis | null;
  environmental?: Record<string, unknown>;
  location?: LocationCoords;
  timestamp?: string;
}

export type Step = 'menu' | 'camera' | 'recording' | 'analyzing' | 'results';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}
