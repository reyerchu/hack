#!/bin/bash

# RWA Hackathon Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting RWA Hackathon deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in the project root directory. Please run this script from the hack directory."
    exit 1
fi

# Step 1: Stop existing processes
print_status "Stopping existing processes..."
pkill -f "npm run dev" || true
pkill -f "npm start" || true
pkill -f "next" || true

# Wait a moment for processes to stop
sleep 2

# Step 2: Kill any process using port 3000
print_status "Freeing up port 3000..."
if lsof -i :3008 >/dev/null 2>&1; then
    print_warning "Port 3000 is in use, killing processes..."
    lsof -ti :3008 | xargs kill -9 || true
    sleep 2
fi

# Step 3: Clean build artifacts
print_status "Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Step 4: Install dependencies (if needed)
print_status "Checking dependencies..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Step 5: Build the application
print_status "Building application..."
npm run build

# Step 6: Start the application
print_status "Starting application on port 3000..."
npm start &

# Wait for the application to start
print_status "Waiting for application to start..."
for i in {1..30}; do
    if curl -s http://localhost:3008 >/dev/null 2>&1; then
        print_success "Application is running on port 3000!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Application failed to start on port 3000"
        exit 1
    fi
    sleep 1
done

# Step 7: Test the application
print_status "Testing application..."
if curl -s http://localhost:3008 | grep -q "RWA"; then
    print_success "Application is serving content correctly!"
else
    print_warning "Application is running but content may not be correct"
fi

# Step 8: Reload Apache (if running as root or with sudo)
if [ "$EUID" -eq 0 ] || command -v sudo >/dev/null 2>&1; then
    print_status "Reloading Apache configuration..."
    if command -v sudo >/dev/null 2>&1; then
        sudo systemctl reload apache2 || print_warning "Could not reload Apache (may need manual reload)"
    else
        systemctl reload apache2 || print_warning "Could not reload Apache (may need manual reload)"
    fi
else
    print_warning "Cannot reload Apache automatically. Please run: sudo systemctl reload apache2"
fi

# Step 9: Final verification
print_status "Final verification..."
sleep 3

if curl -s -k https://hackathon.com.tw >/dev/null 2>&1; then
    print_success "✅ Deployment completed successfully!"
    print_success "🌐 Application is available at: https://hackathon.com.tw"
    print_success "🔧 Local development server: http://localhost:3008"
else
    print_warning "⚠️  Deployment completed but HTTPS may not be working"
    print_success "🔧 Local development server: http://localhost:3008"
fi

echo ""
print_success "🎉 RWA Hackathon deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "  • Application: Running on port 3000"
echo "  • HTTPS: https://hackathon.com.tw"
echo "  • Local: http://localhost:3008"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs: tail -f /var/log/apache2/hackathon_error.log"
echo "  • Restart Apache: sudo systemctl restart apache2"
echo "  • Stop app: pkill -f 'npm start'"
echo "  • Redeploy: ./deploy.sh"
