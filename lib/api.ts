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
  voiceUri?: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Sends eye photo, optional voice, and location to backend for health analysis.
 * Backend fetches pollen and calls Claude with the image.
 */
export async function analyzeHealth(payload: AnalyzePayload): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('latitude', String(payload.latitude));
  formData.append('longitude', String(payload.longitude));
  formData.append('imageBase64', payload.imageBase64);
  formData.append('imageMediaType', payload.imageMediaType || 'image/jpeg');

  if (payload.voiceUri) {
    const name = payload.voiceUri.split('/').pop() || 'voice.m4a';
    formData.append('voice', {
      uri: payload.voiceUri,
      name,
      type: 'audio/m4a',
    } as unknown as Blob);
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
    throw new Error(text || `Analysis failed: ${response.status}`);
  }

  const data = (await response.json()) as AnalysisResult;
  if (typeof data.sicknessProbability !== 'number') {
    throw new Error('Invalid analysis response');
  }
  return data;
}
