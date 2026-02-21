import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

const configured =
  (typeof extra.apiUrl === 'string' ? extra.apiUrl : null) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  '';

/**
 * Backend base URL.
 * - On web (deployed): empty string → relative fetch (same origin as the site).
 * - On native / local dev: falls back to http://localhost:3001.
 */
export const API_URL =
  configured && configured !== 'http://localhost:3001'
    ? configured
    : Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname !== 'localhost'
      ? ''
      : 'http://localhost:3001';
