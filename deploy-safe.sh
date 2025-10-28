#!/bin/bash
set -e

cd /home/reyerchu/hack/hack

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 SAFE DEPLOYMENT TO MAIN (PRODUCTION)                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📥 Step 1/8: Pull latest code..."
git pull origin main

echo "�� Step 2/8: Clean build caches..."
rm -rf .next node_modules/.cache

echo "🛑 Step 3/8: Stop PM2 process..."
pm2 stop hackportal 2>/dev/null || true

echo "🗑️  Step 4/8: Delete PM2 process..."
pm2 delete hackportal 2>/dev/null || true

echo "🔫 Step 5/8: Kill any process on port 3008..."
lsof -ti:3008 | xargs -r kill -9
sleep 2

echo "🏗️  Step 6/8: Build project..."
npm run build

echo "🚀 Step 7/8: Start fresh PM2 process..."
pm2 start npm --name hackportal -- start -- -p 3008
sleep 8

echo "✅ Step 8/8: Verify and save..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3008)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ HTTP Status: 200"
else
    echo "   ❌ HTTP Status: $HTTP_STATUS"
    exit 1
fi

pm2 save
pm2 list

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT SUCCESSFUL                                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Site: https://hackathon.com.tw/"
echo "⚠️  Clear browser cache: Ctrl+Shift+R (Windows/Linux)"
echo "⚠️  Clear browser cache: Cmd+Shift+R (Mac)"
echo ""
