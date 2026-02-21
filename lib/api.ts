import { API_URL } from './config';
import type { AnalysisResult } from './types';

/** Check if the backend is reachable. Call before starting the health check flow. */
export async function checkBackend(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${API_URL}/health`, { method: 'GET' });
    if (res.ok) return { ok: true };
    return { ok: false, message: `Backend returned ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return {
      ok: false,
      message: `Cannot reach backend at ${API_URL}. ${msg}`,
    };
  }
}

export interface AnalyzePayload {
  imageBase64: string;
  imageMediaType: string;
  /** Voice recording as base64 (avoids multipart file upload issues). */
  voiceBase64?: string | null;
  voiceMediaType?: string;
  latitude: number;
  longitude: number;
}

/**
 * Sends eye photo, optional voice (base64), and location to backend for health analysis.
 */
export async function analyzeHealth(payload: AnalyzePayload): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('latitude', String(payload.latitude));
  formData.append('longitude', String(payload.longitude));
  formData.append('imageBase64', payload.imageBase64);
  formData.append('imageMediaType', payload.imageMediaType || 'image/jpeg');

  if (payload.voiceBase64) {
    formData.append('voiceBase64', payload.voiceBase64);
    formData.append('voiceMediaType', payload.voiceMediaType || 'audio/m4a');
  }

  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Analysis failed: ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json?.error) message = json.error;
    } catch {
      // use message as-is
    }
    throw new Error(message);
  }

  const data = (await response.json()) as AnalysisResult;
  if (typeof data.sicknessProbability !== 'number') {
    throw new Error('Invalid analysis response');
  }
  return data;
}
