#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 Main Branch Auto-Deploy Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# This script ensures a clean deployment by:
# 1. Stopping all processes on port 3008
# 2. Building the project fresh
# 3. Starting PM2 with the new build
# 4. Verifying the deployment
#
# Usage: ./scripts/deploy-main.sh
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/reyerchu/hack/hack"
PORT=3008
APP_NAME="hackportal"
MAX_RETRIES=3
HEALTH_CHECK_DELAY=10

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helper Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1: Kill all processes on port 3008
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

kill_port_processes() {
    log_info "Checking for processes on port $PORT..."
    
    # Find all PIDs using port 3008
    local pids=$(lsof -ti:$PORT 2>/dev/null || true)
    
    if [ -z "$pids" ]; then
        log_success "No processes found on port $PORT"
        return 0
    fi
    
    log_warning "Found processes on port $PORT: $pids"
    log_info "Killing processes..."
    
    for pid in $pids; do
        kill -9 $pid 2>/dev/null || true
        log_success "Killed process $pid"
    done
    
    # Wait for port to be released
    sleep 2
    
    # Verify port is free
    if lsof -ti:$PORT 2>/dev/null; then
        log_error "Failed to free port $PORT"
        return 1
    fi
    
    log_success "Port $PORT is now free"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2: Stop PM2 app (if running)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

stop_pm2_app() {
    log_info "Stopping PM2 app: $APP_NAME..."
    
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 stop $APP_NAME 2>/dev/null || true
        pm2 delete $APP_NAME 2>/dev/null || true
        log_success "PM2 app stopped and deleted"
    else
        log_info "PM2 app not running"
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3: Clean and Build
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

clean_and_build() {
    log_info "Changing to project directory: $PROJECT_DIR"
    cd $PROJECT_DIR
    
    log_info "Cleaning old build artifacts..."
    rm -rf .next
    log_success "Cleaned .next directory"
    
    log_info "Building project..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        return 1
    fi
    
    # Verify CSS files exist
    local css_files=$(find .next/static/css -name "*.css" 2>/dev/null | wc -l)
    if [ $css_files -gt 0 ]; then
        log_success "Found $css_files CSS files in build"
        find .next/static/css -name "*.css" -exec basename {} \; | head -3
    else
        log_error "No CSS files found in build!"
        return 1
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 4: Start PM2
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

start_pm2() {
    log_info "Starting PM2 app: $APP_NAME..."
    
    cd $PROJECT_DIR
    pm2 start ecosystem.config.js --only $APP_NAME
    
    if [ $? -eq 0 ]; then
        log_success "PM2 app started"
    else
        log_error "Failed to start PM2 app"
        return 1
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 5: Health Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

health_check() {
    log_info "Waiting $HEALTH_CHECK_DELAY seconds for app to start..."
    sleep $HEALTH_CHECK_DELAY
    
    log_info "Performing health check..."
    
    # Check if process is running
    if ! pm2 list | grep -q "online.*$APP_NAME"; then
        log_error "PM2 app is not online"
        pm2 logs $APP_NAME --lines 20 --nostream
        return 1
    fi
    
    # Check if port is responding
    if ! curl -f -s -o /dev/null http://localhost:$PORT; then
        log_error "Port $PORT is not responding"
        return 1
    fi
    
    # Check CSS loading
    log_info "Checking CSS files..."
    local css_link=$(curl -s http://localhost:$PORT | grep -o 'href="/_next/static/css/[^"]*"' | head -1)
    
    if [ -z "$css_link" ]; then
        log_error "No CSS link found in HTML"
        return 1
    fi
    
    log_info "Found CSS link: $css_link"
    
    local css_path=$(echo $css_link | sed 's/href="//;s/"//')
    local css_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT$css_path")
    
    if [ "$css_status" == "200" ]; then
        log_success "CSS file is accessible (HTTP $css_status)"
    else
        log_error "CSS file returned HTTP $css_status"
        return 1
    fi
    
    log_success "Health check passed!"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 6: Display Status
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

display_status() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Deployment Successful!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    pm2 list
    echo ""
    echo "🌐 Application URL: http://localhost:$PORT"
    echo ""
    echo "📝 Useful Commands:"
    echo "  - View logs:    pm2 logs $APP_NAME"
    echo "  - Restart:      pm2 restart $APP_NAME"
    echo "  - Stop:         pm2 stop $APP_NAME"
    echo "  - Monitor:      pm2 monit"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main Deployment Flow
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 Starting Main Branch Deployment"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Step 1: Kill port processes
    if ! kill_port_processes; then
        log_error "Failed to free port $PORT"
        exit 1
    fi
    echo ""
    
    # Step 2: Stop PM2
    stop_pm2_app
    echo ""
    
    # Step 3: Build
    if ! clean_and_build; then
        log_error "Build failed"
        exit 1
    fi
    echo ""
    
    # Step 4: Start PM2
    if ! start_pm2; then
        log_error "Failed to start PM2"
        exit 1
    fi
    echo ""
    
    # Step 5: Health check
    if ! health_check; then
        log_error "Health check failed"
        log_warning "Showing recent logs:"
        pm2 logs $APP_NAME --lines 30 --nostream
        exit 1
    fi
    echo ""
    
    # Step 6: Display status
    display_status
}

# Run main function
main "$@"

