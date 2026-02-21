/** Health assessment result from Claude backend */
export interface AnalysisResult {
  sicknessProbability: number;
  symptoms?: string[];
  eyeAnalysis?: string;
  environmentalFactors?: string;
  recommendations?: string;
  severity?: string;
  shouldSeeDoctor?: boolean;
}

export type Step = 'menu' | 'camera' | 'recording' | 'analyzing' | 'results';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}
