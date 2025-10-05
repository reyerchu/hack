#!/bin/bash

# Quick deployment script for RWA Hackathon
# Use this for rapid development deployments

echo "🚀 Quick deployment starting..."

# Stop existing processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Kill anything on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Clean and restart
rm -rf .next
npm run dev &

# Wait for startup
sleep 10

echo "✅ Quick deployment complete!"
echo "🌐 Local: http://localhost:3000"
echo "🌐 HTTPS: https://hackathon.com.tw"
