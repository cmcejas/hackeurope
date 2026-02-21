import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/** Backend base URL. Set EXPO_PUBLIC_API_URL in .env or app.config.js extra. */
export const API_URL =
  (typeof extra.apiUrl === 'string' ? extra.apiUrl : null) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:3001';
