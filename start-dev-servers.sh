#!/bin/bash

# Bash script to start both backend and frontend servers for phone testing
# This script binds servers to all network interfaces so they're accessible from your phone

echo "🚀 Starting AgroBridge Development Servers for Phone Testing"
echo ""

# Get local IP address (works on Linux and macOS)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    localIP=$(ip route get 8.8.8.8 2>/dev/null | awk '{print $7; exit}' | head -1)
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    localIP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
fi

# Fallback if IP detection fails
if [ -z "$localIP" ]; then
    localIP="127.0.0.1"
    echo "⚠️  Could not detect local network IP. Using 127.0.0.1"
    echo "   You may need to manually find your IP address using: ifconfig or ip addr"
else
    echo "📱 Your local IP address: $localIP"
    echo ""
fi

# Check if .env file exists in root
if [ -f ".env" ]; then
    echo "📝 Updating .env file with local IP..."
    
    # Update VITE_API_URL if it exists, otherwise add it
    if grep -q "VITE_API_URL=" .env; then
        sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=http://$localIP:8000/api/v1|" .env
    else
        echo "VITE_API_URL=http://$localIP:8000/api/v1" >> .env
    fi
    
    echo "✅ Updated VITE_API_URL to http://$localIP:8000/api/v1"
fi

# Check if frontend .env.local file exists (Vite prioritizes .env.local)
if [ -f "frontend/.env.local" ]; then
    echo "📝 Updating frontend .env.local file with local IP..."
    
    if grep -q "VITE_API_URL=" frontend/.env.local; then
        sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=http://$localIP:8000/api/v1|" frontend/.env.local
    else
        echo "VITE_API_URL=http://$localIP:8000/api/v1" >> frontend/.env.local
    fi
    
    # Also update WebSocket URL if it exists
    if grep -q "VITE_WEBSOCKET_URL=" frontend/.env.local; then
        sed -i.bak "s|VITE_WEBSOCKET_URL=.*|VITE_WEBSOCKET_URL=ws://$localIP:8000/ws/|" frontend/.env.local
    fi
    
    echo "✅ Updated frontend .env.local VITE_API_URL"
elif [ -f "frontend/.env" ]; then
    echo "📝 Updating frontend .env file with local IP..."
    
    if grep -q "VITE_API_URL=" frontend/.env; then
        sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=http://$localIP:8000/api/v1|" frontend/.env
    else
        echo "VITE_API_URL=http://$localIP:8000/api/v1" >> frontend/.env
    fi
    
    echo "✅ Updated frontend .env VITE_API_URL"
else
    # Create frontend .env.local if it doesn't exist (Vite prioritizes this)
    echo "📝 Creating frontend .env.local file..."
    echo "VITE_API_URL=http://$localIP:8000/api/v1" > frontend/.env.local
    echo "VITE_WEBSOCKET_URL=ws://$localIP:8000/ws/" >> frontend/.env.local
    echo "✅ Created frontend .env.local file"
fi

echo ""
echo "============================================================"
echo "📱 PHONE ACCESS INFORMATION"
echo "============================================================"
echo "Frontend URL: http://$localIP:8080"
echo "Backend API:  http://$localIP:8000/api/v1"
echo ""
echo "⚠️  Make sure your phone is on the same Wi-Fi network!"
echo "============================================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting Backend Server..."
cd backend

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "../venv/bin/activate" ]; then
    source ../venv/bin/activate
fi

echo "   Backend will be available at: http://$localIP:8000"
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🎨 Starting Frontend Server..."
cd ../frontend

echo "   Frontend will be available at: http://$localIP:8080"
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Both servers are running!"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for both processes
wait

