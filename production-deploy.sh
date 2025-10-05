#!/bin/bash

# Production deployment script for RWA Hackathon
# This script handles production deployment with proper service management

set -e

echo "🚀 Production deployment starting..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop all existing processes
print_status "Stopping all existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true

# Kill anything on port 3000
if lsof -i :3000 >/dev/null 2>&1; then
    print_status "Freeing port 3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

sleep 3

# Step 2: Clean build
print_status "Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Step 3: Build for production
print_status "Building for production..."
npm run build

# Step 4: Start production server
print_status "Starting production server..."
npm start &

# Wait for startup
print_status "Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "Production server is running!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Failed to start production server"
        exit 1
    fi
    sleep 1
done

# Step 5: Reload Apache
print_status "Reloading Apache..."
sudo systemctl reload apache2 2>/dev/null || print_status "Apache reload may need manual intervention"

# Step 6: Verify deployment
print_status "Verifying deployment..."
sleep 3

if curl -s -k https://hackathon.com.tw >/dev/null 2>&1; then
    print_success "✅ Production deployment successful!"
    print_success "🌐 HTTPS: https://hackathon.com.tw"
else
    print_status "⚠️  HTTPS may need manual verification"
fi

print_success "🎉 Production deployment completed!"
