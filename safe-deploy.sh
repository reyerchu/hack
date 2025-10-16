#!/bin/bash
# Safe Deployment Script for Next.js + PM2
# Prevents cache mismatch issues

set -e  # Exit on error

APP_NAME="hackportal"

echo "🚀 Starting Safe Deployment..."
echo ""

# Step 1: Stop service
echo "1️⃣ Stopping service..."
pm2 stop $APP_NAME || true

# Step 2: Clean build cache
echo "2️⃣ Cleaning build cache..."
rm -rf .next
echo "   ✓ .next/ removed"

# Step 3: Build
echo "3️⃣ Building application..."
npm run build
echo "   ✓ Build completed"

# Step 4: Complete restart (clears all cache)
echo "4️⃣ Complete restart (clearing all cache)..."
pm2 delete $APP_NAME || true
pm2 start ecosystem.config.js --env production
echo "   ✓ Service restarted with fresh cache"

# Step 5: Save PM2 state
echo "5️⃣ Saving PM2 state..."
pm2 save
echo "   ✓ PM2 state saved"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service status:"
pm2 list | grep $APP_NAME

echo ""
echo "🌐 Test the website:"
echo "   Local:  http://localhost:3008/"
echo "   Online: https://hackathon.com.tw/"
echo ""
echo "⚠️  Remember to force refresh in browser (Ctrl+Shift+R)"
