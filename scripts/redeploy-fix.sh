#!/bin/bash

# Redeploy Fix Script - Auto fix CSS and deployment issues
# Usage: ./scripts/redeploy-fix.sh

set -e

echo "🔧 Starting redeploy fix script..."
echo ""

# Step 1: Kill any process on port 3008
echo "1️⃣ Cleaning port 3008..."
lsof -ti:3008 | xargs kill -9 2>/dev/null || true
echo "✅ Port 3008 cleaned"
echo ""

# Step 2: Stop PM2 process
echo "2️⃣ Stopping PM2 hackportal..."
pm2 stop hackportal 2>/dev/null || true
pm2 delete hackportal 2>/dev/null || true
echo "✅ PM2 hackportal stopped"
echo ""

# Step 3: Clean build artifacts
echo "3️⃣ Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ Build artifacts cleaned"
echo ""

# Step 4: Rebuild
echo "4️⃣ Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build completed"
echo ""

# Step 5: Start PM2
echo "5️⃣ Starting PM2 hackportal..."
cd /home/reyerchu/hack/hack
pm2 start npm --name hackportal -- start
sleep 5
echo "✅ PM2 hackportal started"
echo ""

# Step 6: Save PM2 config
echo "6️⃣ Saving PM2 configuration..."
pm2 save
echo "✅ PM2 configuration saved"
echo ""

# Step 7: Verify deployment
echo "7️⃣ Verifying deployment..."
sleep 3

# Check if CSS files exist
if [ ! -f ".next/static/css/"*.css ]; then
    echo "❌ CSS files not found!"
    exit 1
fi
echo "✅ CSS files verified"

# Check HTTP status
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3008)
if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ HTTP status check failed: $HTTP_STATUS"
    exit 1
fi
echo "✅ HTTP status: $HTTP_STATUS"
echo ""

# Step 8: Show final status
echo "8️⃣ Final status:"
pm2 list
echo ""

echo "✅✅✅ REDEPLOY COMPLETED SUCCESSFULLY! ✅✅✅"
echo ""
echo "📝 Next steps:"
echo "   1. Open browser: https://hackathon.com.tw"
echo "   2. Press: Ctrl+Shift+R (hard refresh)"
echo "   3. Check if CSS is loaded"
echo ""

