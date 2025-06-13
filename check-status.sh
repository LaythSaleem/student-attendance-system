#!/bin/bash

echo "🔍 Scholar Track Pulse - Application Status Check"
echo "================================================"

# Check backend
echo "🔧 Checking Backend (Port 3001)..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Backend is running on port 3001"
    
    # Test API endpoint
    if curl -s http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"test":"data"}' > /dev/null 2>&1; then
        echo "✅ Backend API is responding"
    else
        echo "⚠️  Backend API may have issues"
    fi
else
    echo "❌ Backend is not running on port 3001"
    echo "🚀 Starting backend..."
    cd "/Users/macbookshop/Desktop/Attendence App"
    node server.cjs &
    echo "⏳ Waiting for backend to start..."
    sleep 3
fi

# Check frontend
echo ""
echo "🎨 Checking Frontend (Port 8080)..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 8080"
else
    echo "❌ Frontend is not running on port 8080"
    echo "🚀 Starting frontend..."
    cd "/Users/macbookshop/Desktop/Attendence App"
    npm run dev &
    echo "⏳ Waiting for frontend to start..."
    sleep 5
fi

echo ""
echo "🎉 Application Status:"
echo "📊 Backend:  http://localhost:3001"
echo "🌐 Frontend: http://localhost:8080"
echo "🔑 Admin Login: admin@school.com / admin123"
echo ""
echo "📋 To access the application:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Login with admin credentials"
echo "3. Navigate to Settings to test System Settings"
