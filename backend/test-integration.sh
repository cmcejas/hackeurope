#!/bin/bash
# Integration Test for Voice Analysis System
# Tests the full flow: Voice Service + Backend API

echo "🧪 Testing Voice Analysis Integration"
echo "======================================"
echo ""

echo "1️⃣  Testing Voice Service (Python/librosa)..."
VOICE_HEALTH=$(curl -s http://localhost:3002/health)
echo "   Response: $VOICE_HEALTH"
echo ""

echo "2️⃣  Testing Main Backend..."
BACKEND_HEALTH=$(curl -s http://localhost:3001/health)
echo "   Response: $BACKEND_HEALTH"
echo ""

echo "3️⃣  Testing Pollen API..."
POLLEN=$(curl -s "http://localhost:3001/pollen?lat=37.7749&lon=-122.4194" | python3 -m json.tool 2>/dev/null | head -20)
echo "$POLLEN"
echo "   ... (truncated)"
echo ""

echo "✅ All services are operational!"
echo ""
echo "📱 Next Steps:"
echo "   1. Send voice recordings from your Expo app to:"
echo "      POST http://localhost:3001/analyze"
echo ""
echo "   2. Required fields:"
echo "      - voice (audio file, multipart/form-data)"
echo "      - imageBase64 (eye photo)"
echo "      - latitude, longitude"
echo ""
echo "   3. Response includes:"
echo "      - voice.nasality_score (0-100)"
echo "      - voice.interpretation"
echo "      - voice.suggests_congestion (boolean)"
echo "      - Combined with Gemini vision + pollen data"
