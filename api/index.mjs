/**
 * Vercel serverless entry: serves the Express backend so /health, /analyze, /pollen, /environmental work.
 * Deploy from repo root so the web app (Expo) and this API are on the same domain.
 */
import app from '../backend/server.js';

export const config = { maxDuration: 60 };

export default app;
