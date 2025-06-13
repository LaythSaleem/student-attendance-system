#!/bin/bash

echo "Starting backend..."
node server.cjs &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"

sleep 3

echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "Frontend started with PID: $FRONTEND_PID"

echo "Both services started. Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
echo "Access the app at: http://localhost:8080"
echo "Backend API at: http://localhost:3001"

# Keep script running
wait
