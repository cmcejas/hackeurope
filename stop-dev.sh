#!/bin/bash
# Stop all HackEurope development services

echo "🛑 Stopping HackEurope Services"
echo "================================"
echo ""

# Stop by PID files
if [ -f /tmp/hackeurope-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/hackeurope-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm /tmp/hackeurope-backend.pid
    fi
fi

if [ -f /tmp/hackeurope-voice.pid ]; then
    VOICE_PID=$(cat /tmp/hackeurope-voice.pid)
    if ps -p $VOICE_PID > /dev/null 2>&1; then
        echo "Stopping voice service (PID: $VOICE_PID)..."
        kill $VOICE_PID
        rm /tmp/hackeurope-voice.pid
    fi
fi

# Fallback: kill by port
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Stopping remaining process on port 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
fi

if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Stopping remaining process on port 3002..."
    lsof -ti:3002 | xargs kill -9 2>/dev/null
fi

echo ""
echo "✅ All services stopped"
