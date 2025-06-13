#!/bin/bash

echo "🚀 Starting Scholar Track Pulse System"
echo "======================================"

# Kill any existing processes
echo "Stopping existing processes..."
pkill -f "node server.cjs" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

# Start backend server
echo "Starting backend server on port 8888..."
cd "/Users/macbookshop/Desktop/Attendence App"
nohup node server.cjs > server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8888/api/health > /dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    cat server.log
    exit 1
fi

# Start frontend
echo "Starting frontend server..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

echo ""
echo "🎉 System Started Successfully!"
echo "==============================="
echo "Backend:  http://localhost:8888"
echo "Frontend: http://localhost:8080 (check frontend.log for actual port)"
echo ""
echo "Default Login: admin@school.com / admin123"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop: pkill -f 'node server.cjs' && pkill -f 'npm run dev'"
