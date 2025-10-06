#!/bin/bash

# RWA Hackathon Service Deployment Script
# This script manages the Next.js application as a systemd service

set -e

SERVICE_NAME="rwa-hackathon"
APP_DIR="/home/reyerchu/hack/hack"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "🚀 RWA Hackathon Service Deployment Script"
echo "=========================================="

# Function to check if service exists
check_service() {
    if systemctl list-unit-files | grep -q "${SERVICE_NAME}.service"; then
        return 0
    else
        return 1
    fi
}

# Function to stop and clean up existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    
    # Stop the service if it exists
    if check_service; then
        echo "Stopping ${SERVICE_NAME} service..."
        sudo systemctl stop ${SERVICE_NAME} || true
    fi
    
    # Kill any processes on port 3000
    echo "Killing processes on port 3000..."
    fuser -k 3000/tcp 2>/dev/null || true
    
    # Kill any npm/node processes in the app directory
    echo "Killing any running npm/node processes..."
    pkill -f "npm run start" || true
    pkill -f "next start" || true
    
    sleep 2
}

# Function to build the application
build_app() {
    echo "🔨 Building Next.js application..."
    cd ${APP_DIR}
    
    # Clean previous build
    rm -rf .next
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Build the application
    echo "Building application..."
    npm run build
    
    echo "✅ Build completed successfully"
}

# Function to create/update systemd service
setup_service() {
    echo "⚙️  Setting up systemd service..."
    
    # Create service file
    sudo tee ${SERVICE_FILE} > /dev/null << EOF
[Unit]
Description=RWA Hackathon Taiwan Next.js Application
After=network.target

[Service]
Type=simple
User=reyerchu
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable service
    sudo systemctl enable ${SERVICE_NAME}
    
    echo "✅ Service configured successfully"
}

# Function to start the service
start_service() {
    echo "🚀 Starting ${SERVICE_NAME} service..."
    
    sudo systemctl start ${SERVICE_NAME}
    
    # Wait for service to start
    sleep 5
    
    # Check service status
    if sudo systemctl is-active --quiet ${SERVICE_NAME}; then
        echo "✅ Service started successfully"
        echo "Service status:"
        sudo systemctl status ${SERVICE_NAME} --no-pager -l
    else
        echo "❌ Service failed to start"
        echo "Service logs:"
        sudo journalctl -u ${SERVICE_NAME} -n 20 --no-pager
        exit 1
    fi
}

# Function to test the deployment
test_deployment() {
    echo "🧪 Testing deployment..."
    
    # Wait for application to be ready
    sleep 10
    
    # Test local connection
    echo "Testing local connection (localhost:3008)..."
    if curl -s http://localhost:3008 > /dev/null; then
        echo "✅ Local connection successful"
    else
        echo "❌ Local connection failed"
        return 1
    fi
    
    # Test Apache proxy
    echo "Testing Apache proxy (https://hackathon.com.tw)..."
    if curl -s -k https://hackathon.com.tw > /dev/null; then
        echo "✅ Apache proxy successful"
    else
        echo "❌ Apache proxy failed"
        return 1
    fi
    
    echo "🎉 All tests passed!"
}

# Function to show service status
show_status() {
    echo "📊 Service Status:"
    echo "=================="
    
    if check_service; then
        sudo systemctl status ${SERVICE_NAME} --no-pager -l
    else
        echo "Service not found"
    fi
    
    echo ""
    echo "Port 3000 status:"
    lsof -i :3008 || echo "No processes on port 3000"
    
    echo ""
    echo "Apache proxy test:"
    curl -s -k https://hackathon.com.tw | head -5 || echo "Apache proxy not working"
}

# Main execution
case "${1:-deploy}" in
    "deploy")
        echo "Starting full deployment..."
        cleanup
        build_app
        setup_service
        start_service
        test_deployment
        echo "🎉 Deployment completed successfully!"
        ;;
    "restart")
        echo "Restarting service..."
        cleanup
        start_service
        test_deployment
        echo "✅ Service restarted successfully!"
        ;;
    "stop")
        echo "Stopping service..."
        cleanup
        echo "✅ Service stopped"
        ;;
    "status")
        show_status
        ;;
    "logs")
        echo "📋 Service logs:"
        sudo journalctl -u ${SERVICE_NAME} -f
        ;;
    *)
        echo "Usage: $0 {deploy|restart|stop|status|logs}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (clean, build, setup, start, test)"
        echo "  restart - Restart the service"
        echo "  stop    - Stop the service"
        echo "  status  - Show service status"
        echo "  logs    - Show service logs (follow mode)"
        exit 1
        ;;
esac
