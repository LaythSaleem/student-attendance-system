#!/bin/bash

echo "🚀 Starting Scholar Track Pulse build for Render..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the frontend
echo "🏗️ Building React frontend..."
npm run build

# Initialize database if it doesn't exist
echo "📊 Setting up database..."
if [ ! -f "database.sqlite" ]; then
    echo "🔧 Initializing database..."
    node init-db.cjs
else
    echo "✅ Database already exists"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 uploads
if [ -f "database.sqlite" ]; then
    chmod 666 database.sqlite
fi

echo "✅ Build complete! Scholar Track Pulse is ready for Render."
