#!/bin/bash

# Simple RWA Hackathon Management Script
# This script provides easy commands to manage the Next.js application

APP_DIR="/home/reyerchu/hack/hack"

case "${1:-help}" in
    "start")
        echo "🚀 Starting RWA Hackathon application..."
        cd ${APP_DIR}
        npm run start &
        echo "✅ Application started in background"
        echo "🌐 Access at: https://hackathon.com.tw"
        ;;
    "stop")
        echo "🛑 Stopping RWA Hackathon application..."
        pkill -f "npm run start" || true
        pkill -f "next start" || true
        fuser -k 3000/tcp 2>/dev/null || true
        echo "✅ Application stopped"
        ;;
    "restart")
        echo "🔄 Restarting RWA Hackathon application..."
        $0 stop
        sleep 2
        $0 start
        ;;
    "status")
        echo "📊 Application Status:"
        echo "====================="
        
        if lsof -i :3008 > /dev/null 2>&1; then
            echo "✅ Application is running on port 3000"
            echo "Processes:"
            lsof -i :3008
        else
            echo "❌ Application is not running"
        fi
        
        echo ""
        echo "🌐 Apache Proxy Test:"
        if curl -s -k https://hackathon.com.tw > /dev/null; then
            echo "✅ Apache proxy is working"
        else
            echo "❌ Apache proxy is not working"
        fi
        ;;
    "logs")
        echo "📋 Application logs (press Ctrl+C to exit):"
        echo "============================================="
        # Show recent logs from the running process
        ps aux | grep "npm run start" | grep -v grep | head -1
        ;;
    "build")
        echo "🔨 Building application..."
        cd ${APP_DIR}
        rm -rf .next
        npm run build
        echo "✅ Build completed"
        ;;
    "deploy")
        echo "🚀 Full deployment..."
        $0 stop
        $0 build
        $0 start
        echo "✅ Deployment completed"
        ;;
    "help"|*)
        echo "RWA Hackathon Management Script"
        echo "=============================="
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|build|deploy|help}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  status  - Show application status"
        echo "  logs    - Show application logs"
        echo "  build   - Build the application"
        echo "  deploy  - Full deployment (stop, build, start)"
        echo "  help    - Show this help message"
        echo ""
        echo "🌐 Application URL: https://hackathon.com.tw"
        ;;
esac
