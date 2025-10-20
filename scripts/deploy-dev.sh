#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 Dev Branch Auto-Deploy Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/home/reyerchu/hack/hack-dev"
PORT=3009
APP_NAME="hackportal-dev"
HEALTH_CHECK_DELAY=10

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Kill port processes
kill_port_processes() {
    log_info "Checking for processes on port $PORT..."
    local pids=$(lsof -ti:$PORT 2>/dev/null || true)
    
    if [ -z "$pids" ]; then
        log_success "No processes found on port $PORT"
        return 0
    fi
    
    log_warning "Found processes on port $PORT: $pids"
    for pid in $pids; do
        kill -9 $pid 2>/dev/null || true
        log_success "Killed process $pid"
    done
    sleep 2
    log_success "Port $PORT is now free"
}

# Stop PM2 app
stop_pm2_app() {
    log_info "Stopping PM2 app: $APP_NAME..."
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 stop $APP_NAME 2>/dev/null || true
        pm2 delete $APP_NAME 2>/dev/null || true
        log_success "PM2 app stopped"
    else
        log_info "PM2 app not running"
    fi
}

# Start PM2 (dev mode - no build needed)
start_pm2_dev() {
    log_info "Starting PM2 app in dev mode: $APP_NAME..."
    cd $PROJECT_DIR
    pm2 start ecosystem.config.js --only $APP_NAME
    log_success "PM2 app started in dev mode"
}

# Health check
health_check() {
    log_info "Waiting $HEALTH_CHECK_DELAY seconds for app to start..."
    sleep $HEALTH_CHECK_DELAY
    
    log_info "Performing health check..."
    
    if ! pm2 list | grep -q "online.*$APP_NAME"; then
        log_error "PM2 app is not online"
        return 1
    fi
    
    if ! curl -f -s -o /dev/null http://localhost:$PORT; then
        log_error "Port $PORT is not responding"
        return 1
    fi
    
    log_success "Health check passed!"
}

# Main
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 Starting Dev Branch Deployment"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    kill_port_processes
    echo ""
    stop_pm2_app
    echo ""
    start_pm2_dev
    echo ""
    
    if ! health_check; then
        log_error "Health check failed"
        pm2 logs $APP_NAME --lines 30 --nostream
        exit 1
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Dev Deployment Successful!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    pm2 list
    echo ""
    echo "🌐 Dev URL: http://localhost:$PORT"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main "$@"

