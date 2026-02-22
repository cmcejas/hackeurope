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
  /** Optional: user-provided allergy history and symptoms (sent to AI). */
  allergyHistory?: string | null;
  /** Optional: user ID for saving to history */
  userId?: string | null;
}

/**
 * Sends eye photo, optional voice (base64), and location to backend for health analysis.
 */
export async function analyzeHealth(payload: AnalyzePayload): Promise<AnalysisResult> {
  const body: Record<string, unknown> = {
    latitude: payload.latitude,
    longitude: payload.longitude,
    imageBase64: payload.imageBase64,
    imageMediaType: payload.imageMediaType || 'image/jpeg',
    voiceBase64: payload.voiceBase64 ?? null,
    voiceMediaType: payload.voiceMediaType || 'audio/m4a',
  };

  if (payload.allergyHistory?.trim()) {
    body.allergyHistory = payload.allergyHistory.trim();
  }

  if (payload.userId) {
    body.userId = payload.userId;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000); // 90s to match backend
  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Analysis timed out. Check that the backend is running and try again.');
    }
    throw err;
  }
  clearTimeout(timeoutId);

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

export interface HistoryItem extends AnalysisResult {
  id: string;
}

/**
 * Fetches user's health check history from the backend
 */
export async function fetchHistory(userId: string): Promise<HistoryItem[]> {
  const response = await fetch(`${API_URL}/history?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Failed to fetch history: ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json?.error) message = json.error;
    } catch {
      // use message as-is
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { history: HistoryItem[] };
  return data.history || [];
}

/**
 * Explicitly save the current analysis result to the user's history.
 * Use this when the user taps "Save to history" on the results screen.
 */
export async function saveResultToHistory(
  userId: string,
  result: AnalysisResult
): Promise<{ id: string }> {
  const response = await fetch(`${API_URL}/save-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ userId, result }),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Failed to save: ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json?.error) message = json.error;
    } catch {
      // use message as-is
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { saved: boolean; id: string };
  return { id: data.id };
}
