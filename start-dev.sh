#!/bin/bash
# Quick start script for HackEurope development
# Starts all services needed for the Expo app

echo "🚀 Starting HackEurope Services"
echo "================================"
echo ""

# Check if services are already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3001 already in use (stopping existing process)"
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3002 already in use (stopping existing process)"
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo ""
echo "1️⃣  Starting Voice Analysis Service (Python/librosa)..."
cd backend/voice-service
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
else
    source venv/bin/activate
fi

python main.py > /tmp/voice-service.log 2>&1 &
VOICE_PID=$!
cd ../..

echo "   Voice service starting (PID: $VOICE_PID)..."
sleep 2

# Check if voice service is up
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "   ✅ Voice service running on http://localhost:3002"
else
    echo "   ❌ Failed to start voice service"
    echo "   Check logs: tail -f /tmp/voice-service.log"
    exit 1
fi

echo ""
echo "2️⃣  Starting Main Backend (Node.js)..."
cd backend
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "   Backend starting (PID: $BACKEND_PID)..."
sleep 2

# Check if backend is up
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✅ Backend running on http://localhost:3001"
else
    echo "   ❌ Failed to start backend"
    echo "   Check logs: tail -f /tmp/backend.log"
    exit 1
fi

echo ""
echo "✅ All services running!"
echo ""
echo "📱 Next steps:"
echo "   1. Start Expo: npm start"
echo "   2. Press 'i' for iOS, 'a' for Android, 'w' for web"
echo "   3. Test the health check flow"
echo ""
echo "📊 Service URLs:"
echo "   Backend API:      http://localhost:3001"
echo "   Voice Service:    http://localhost:3002"
echo ""
echo "📝 View logs:"
echo "   Backend:          tail -f /tmp/backend.log"
echo "   Voice Service:    tail -f /tmp/voice-service.log"
echo ""
echo "🛑 Stop services:"
echo "   kill $BACKEND_PID $VOICE_PID"
echo "   or run: ./stop-dev.sh"
echo ""

# Save PIDs for stop script
echo "$BACKEND_PID" > /tmp/hackeurope-backend.pid
echo "$VOICE_PID" > /tmp/hackeurope-voice.pid
