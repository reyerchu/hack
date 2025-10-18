#!/bin/bash

# Safe Deployment Script v2.0
# Includes port conflict detection and zombie process cleanup

set -e  # Exit on error

PORT=3008
APP_NAME="hackportal"

echo "🚀 Starting Safe Deployment v2.0..."
echo ""

# 1. Check for port conflicts
echo "1️⃣ Checking for port conflicts..."
if lsof -i :$PORT >/dev/null 2>&1; then
    echo "⚠️  Port $PORT is in use by:"
    lsof -i :$PORT | grep LISTEN
    
    read -p "   Kill processes and continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Killing processes on port $PORT..."
        lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
        sleep 2
        echo "   ✓ Port cleaned"
    else
        echo "   ✗ Deployment cancelled"
        exit 1
    fi
else
    echo "   ✓ Port $PORT is available"
fi
echo ""

# 2. Check for zombie PM2 processes
echo "2️⃣ Checking for zombie PM2 processes..."
ZOMBIE_COUNT=$(pm2 jlist | jq '.[] | select(.pm2_env.restart_time > 10) | .name' 2>/dev/null | wc -l)
if [ "$ZOMBIE_COUNT" -gt 0 ]; then
    echo "   ⚠️  Found $ZOMBIE_COUNT processes with high restart counts"
    pm2 jlist | jq '.[] | select(.pm2_env.restart_time > 10) | {name, restarts: .pm2_env.restart_time, status: .pm2_env.status}' 2>/dev/null || true
fi
echo ""

# 3. Stop existing service
echo "3️⃣ Stopping service..."
pm2 stop $APP_NAME 2>/dev/null || echo "   (Service not running)"
pm2 delete $APP_NAME 2>/dev/null || echo "   (Service not in PM2)"
echo "   ✓ Service stopped"
echo ""

# 4. Clean build cache
echo "4️⃣ Cleaning build cache..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "   ✓ .next/ removed"
else
    echo "   (No .next/ directory found)"
fi
echo ""

# 5. Build application
echo "5️⃣ Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "   ✗ Build failed!"
    exit 1
fi
echo "   ✓ Build completed"
echo ""

# 6. Verify port is still free
echo "6️⃣ Final port check..."
if lsof -i :$PORT >/dev/null 2>&1; then
    echo "   ✗ Port $PORT became occupied during build!"
    lsof -i :$PORT
    exit 1
fi
echo "   ✓ Port still available"
echo ""

# 7. Start service
echo "7️⃣ Starting service..."
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "   ✗ Failed to start service!"
    exit 1
fi
echo "   ✓ Service started"
echo ""

# 8. Wait and verify
echo "8️⃣ Verifying service health..."
sleep 5

# Check restart count
RESTART_COUNT=$(pm2 jlist | jq ".[] | select(.name == \"$APP_NAME\") | .pm2_env.restart_time" 2>/dev/null)
echo "   Restart count: $RESTART_COUNT"

if [ "$RESTART_COUNT" -gt 3 ]; then
    echo "   ⚠️  WARNING: High restart count detected!"
    echo ""
    echo "   Recent logs:"
    pm2 logs $APP_NAME --lines 20 --nostream
    echo ""
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Rollback: stopping service..."
        pm2 stop $APP_NAME
        pm2 delete $APP_NAME
        exit 1
    fi
fi

# Check HTTP response
echo "   Testing HTTP endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ HTTP 200 OK"
else
    echo "   ✗ HTTP $HTTP_CODE (expected 200)"
    echo ""
    echo "   Service logs:"
    pm2 logs $APP_NAME --lines 20 --nostream
    exit 1
fi
echo ""

# 9. Save PM2 state
echo "9️⃣ Saving PM2 state..."
pm2 save
echo "   ✓ PM2 state saved"
echo ""

# 10. Final status
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service status:"
pm2 status $APP_NAME
echo ""
echo "🌐 Test the website:"
echo "   Local:  http://localhost:$PORT/"
echo "   Online: https://hackathon.com.tw/"
echo ""
echo "📝 Useful commands:"
echo "   View logs:   pm2 logs $APP_NAME"
echo "   Restart:     pm2 restart $APP_NAME"
echo "   Stop:        pm2 stop $APP_NAME"
echo "   Monitor:     pm2 monit"
echo ""
echo "⚠️  Remember to force refresh in browser (Ctrl+Shift+R)"

