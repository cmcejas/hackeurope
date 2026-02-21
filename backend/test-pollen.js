// Test script for pollen/environmental endpoints (Google Pollen API).
// Start the server first: npm run dev
// Then: node test-pollen.js

import fetch from 'node-fetch';

const BASE = 'http://localhost:3001';

async function testPollen() {
  console.log('🧪 Testing Google Pollen API integration\n');
  const locations = [
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
  ];

  for (const { name, lat, lon } of locations) {
    console.log(`📍 ${name} (${lat}, ${lon})`);
    try {
      const res = await fetch(`${BASE}/pollen?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.error) {
        console.log(`   ⚠️ ${data.error}\n`);
        continue;
      }
      console.log(`   ✅ Pollen level: ${data.pollen?.level ?? 'N/A'}, max index: ${data.pollen?.maxIndex ?? 'N/A'}`);
      console.log(`   Allergy risk: ${data.allergyRiskScore?.level ?? 'N/A'}\n`);
    } catch (e) {
      console.log(`   ❌ ${e.message}\n`);
    }
  }

  console.log('Tip: Ensure backend is running (npm run dev) and GOOGLE_POLLEN_API_KEY is set in backend/.env');
  console.log('Test manually: curl "http://localhost:3001/pollen?lat=37.7749&lon=-122.4194"');
}

testPollen().catch(console.error);
