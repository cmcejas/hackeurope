#!/usr/bin/env node
/**
 * Model evaluation script: feed different prompts/symptoms to the backend
 * and check how often the model's response matches expected criteria.
 *
 * Prerequisites:
 *   - Backend running: npm run dev (in backend/)
 *   - GEMINI_API_KEY and optional GOOGLE_POLLEN_API_KEY in backend/.env
 *
 * Usage:
 *   node scripts/evaluate-model.js [baseUrl]
 *   baseUrl defaults to http://localhost:3001
 *
 * Optional: set TEST_IMAGE_BASE64 to a base64 string of a real eye image
 * for more realistic evaluation (otherwise uses a minimal placeholder image).
 */

import { testCases } from './model-test-cases.js';

const BASE_URL = process.env.BASE_URL || process.argv[2] || 'http://localhost:3001';

// Minimal valid 1x1 pixel JPEG (so we can run without a real image; model mainly sees the text prompt)
const MINIMAL_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEAAhEwEAAt';

function getTestImageBase64() {
  if (process.env.TEST_IMAGE_BASE64) {
    return process.env.TEST_IMAGE_BASE64.replace(/^data:image\/\w+;base64,/, '');
  }
  return MINIMAL_JPEG_BASE64;
}

function checkCase(result, expected) {
  const errors = [];
  const sick = result.sicknessProbability ?? 0;
  const allergy = result.allergyProbability ?? 0;

  if (expected.sicknessProbabilityRange) {
    const [min, max] = expected.sicknessProbabilityRange;
    if (sick < min || sick > max) {
      errors.push(`sicknessProbability ${sick} outside [${min}, ${max}]`);
    }
  }
  if (expected.allergyProbabilityRange != null) {
    const [min, max] = expected.allergyProbabilityRange;
    if (allergy < min || allergy > max) {
      errors.push(`allergyProbability ${allergy} outside [${min}, ${max}]`);
    }
  }
  if (expected.shouldSeeDoctor !== undefined) {
    const actual = Boolean(result.shouldSeeDoctor);
    if (actual !== expected.shouldSeeDoctor) {
      errors.push(`shouldSeeDoctor ${actual} expected ${expected.shouldSeeDoctor}`);
    }
  }
  if (expected.severityOneOf != null && expected.severityOneOf.length) {
    const s = (result.severity || '').toLowerCase();
    if (!expected.severityOneOf.map((x) => x.toLowerCase()).includes(s)) {
      errors.push(`severity "${result.severity}" not in [${expected.severityOneOf.join(', ')}]`);
    }
  }
  if (expected.allergyProbabilityLteSickness !== false) {
    if (allergy > sick) {
      errors.push(`allergyProbability (${allergy}) > sicknessProbability (${sick})`);
    }
  }

  return { passed: errors.length === 0, errors };
}

async function runOne(baseUrl, payload) {
  const res = await fetch(`${baseUrl}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }
  if (typeof data.sicknessProbability !== 'number') {
    throw new Error('Response missing sicknessProbability');
  }
  return data;
}

async function main() {
  const imageBase64 = getTestImageBase64();
  const lat = 53.343792;
  const lon = -6.254492;

  console.log('Model evaluation');
  console.log('Base URL:', BASE_URL);
  console.log('Test cases:', testCases.length);
  console.log('Image: ', process.env.TEST_IMAGE_BASE64 ? 'custom (TEST_IMAGE_BASE64)' : 'minimal placeholder');
  console.log('');

  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    process.stdout.write(`  [${i + 1}/${testCases.length}] ${tc.name} ... `);
    try {
      const result = await runOne(BASE_URL, {
        imageBase64,
        imageMediaType: 'image/jpeg',
        latitude: lat,
        longitude: lon,
        allergyHistory: tc.allergyHistory,
      });
      const { passed, errors } = checkCase(result, tc.expected);
      results.push({ name: tc.name, passed, errors, result });
      if (passed) {
        console.log('PASS');
      } else {
        console.log('FAIL');
        errors.forEach((e) => console.log('      -', e));
      }
    } catch (err) {
      results.push({ name: tc.name, passed: false, errors: [err.message], result: null });
      console.log('ERROR');
      console.log('      -', err.message);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const accuracy = results.length ? ((passed / results.length) * 100).toFixed(1) : 0;
  console.log('');
  console.log('---');
  console.log(`Passed: ${passed}/${results.length} (${accuracy}% correct)`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
