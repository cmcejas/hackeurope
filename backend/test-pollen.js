// Simple test script for pollen API functionality
import fetch from 'node-fetch';

async function testEnvironmentalData() {
  console.log('🧪 Testing Open-Meteo Environmental Data Integration\n');

  const testLocations = [
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 }
  ];

  for (const location of testLocations) {
    console.log(`📍 Testing ${location.name} (${location.lat}, ${location.lon})`);

    // Calculate 48-hour date range
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const startDate = twoDaysAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const url = `https://air-quality.open-meteo.com/v1/air-quality?` +
      `latitude=${location.lat}&longitude=${location.lon}` +
      `&start_date=${startDate}&end_date=${endDate}` +
      `&hourly=pm10,pm2_5,alder_pollen,birch_pollen,grass_pollen,ragweed_pollen` +
      `&timezone=auto`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`   ❌ API Error: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const hourly = data.hourly;

      // Check if we got data
      const grassPollen = hourly.grass_pollen?.filter(v => v !== null) || [];
      const pm25 = hourly.pm2_5?.filter(v => v !== null) || [];

      console.log(`   ✅ Success!`);
      console.log(`   📊 Data points: ${hourly.time?.length || 0} hours`);
      console.log(`   🌾 Grass pollen: ${grassPollen.length > 0 ? `${Math.max(...grassPollen).toFixed(1)} grains/m³ (max)` : 'N/A'}`);
      console.log(`   💨 PM2.5: ${pm25.length > 0 ? `${(pm25.reduce((a,b) => a+b, 0) / pm25.length).toFixed(1)} µg/m³ (avg)` : 'N/A'}`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('✅ Test complete!\n');
  console.log('Next steps:');
  console.log('1. Start the server: npm start');
  console.log('2. Test the endpoint: curl "http://localhost:3001/environmental?lat=37.7749&lon=-122.4194"');
}

testEnvironmentalData().catch(console.error);
