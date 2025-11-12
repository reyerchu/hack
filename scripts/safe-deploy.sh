#!/bin/bash
# Safe Deployment Script for Next.js + PM2
# Prevents cache mismatch, port conflicts, and type errors

set -e  # Exit on error

APP_NAME="hackportal"
PORT=3008

echo "════════════════════════════════════════"
echo "  🚀 Safe Deployment with Pre-checks"
echo "════════════════════════════════════════"
echo ""

# Step 0: Pre-deployment checks
echo "0️⃣ Pre-deployment checks..."

# 0.1 Check for ALL zombie processes on port (aggressive cleanup)
ZOMBIE_PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
if [ ! -z "$ZOMBIE_PIDS" ]; then
  echo "   ⚠️  Port $PORT occupied by processes: $ZOMBIE_PIDS"
  echo "   Killing ALL processes on port $PORT..."
  echo "$ZOMBIE_PIDS" | xargs -r kill -9 2>/dev/null || true
  sleep 3
  
  # Verify port is free
  if lsof -i :$PORT >/dev/null 2>&1; then
    echo "   ❌ FAILED to free port $PORT!"
    lsof -i :$PORT
    echo ""
    echo "   ABORTING deployment. Run: ./fix-zombie.sh"
    exit 1
  fi
  echo "   ✓ All zombies killed, port is free"
fi

# 0.2 TypeScript type check
echo "   Running TypeScript check..."
if ! npx tsc --noEmit --skipLibCheck 2>&1 | tee /tmp/tsc-check.log; then
  echo ""
  echo "   ❌ TypeScript errors detected:"
  tail -30 /tmp/tsc-check.log
  echo ""
  echo "   Fix errors before deploying!"
  exit 1
fi
echo "   ✓ TypeScript OK"
echo ""

# Step 1: Stop service
echo "1️⃣ Stopping service..."
pm2 stop $APP_NAME 2>/dev/null || echo "   (not running)"
echo "   ✓ Stopped"
echo ""

# Step 2: Clean build cache
echo "2️⃣ Cleaning build cache..."
rm -rf .next
echo "   ✓ .next/ removed"
echo ""

# Step 3: Build
echo "3️⃣ Building application..."
if ! npm run build 2>&1 | tee /tmp/build.log; then
  echo ""
  echo "   ❌ Build failed!"
  echo ""
  tail -40 /tmp/build.log
  echo ""
  exit 1
fi
echo "   ✓ Build completed"
echo ""

# Step 4: Delete old PM2 instance
echo "4️⃣ Deleting old PM2 instance..."
pm2 delete $APP_NAME 2>/dev/null || echo "   (no instance)"
echo "   ✓ Deleted"
echo ""

# Step 5: Final port check (triple check!)
echo "5️⃣ Final port check..."
ATTEMPTS=0
while [ $ATTEMPTS -lt 3 ]; do
  if lsof -i :$PORT >/dev/null 2>&1; then
    echo "   ⚠️  Port $PORT still occupied (attempt $((ATTEMPTS + 1))/3)"
    lsof -i :$PORT
    echo "   Force killing..."
    lsof -ti :$PORT | xargs -r kill -9 2>/dev/null || true
    sleep 2
    ATTEMPTS=$((ATTEMPTS + 1))
  else
    echo "   ✓ Port $PORT is free"
    break
  fi
done

if lsof -i :$PORT >/dev/null 2>&1; then
  echo "   ❌ CRITICAL: Cannot free port $PORT after 3 attempts!"
  echo "   Run: ./fix-zombie.sh"
  exit 1
fi
echo ""

# Step 6: Start new instance
echo "6️⃣ Starting new PM2 instance..."
pm2 start ecosystem.config.js --env production
echo "   ✓ Started"
echo ""

# Step 7: Health check (more thorough)
echo "7️⃣ Health check..."
sleep 5

MAX_RETRIES=15
RETRY=0
SUCCESS=0

while [ $RETRY -lt $MAX_RETRIES ]; do
  STATUS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
  RESTARTS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
  
  if [ "$STATUS" = "online" ] && [ "$RESTARTS" -lt 5 ]; then
    echo "   Status: online (restarts: $RESTARTS)"
    
    # Test HTTP with actual content check
    sleep 2
    HTTP_RESPONSE=$(curl -sf http://localhost:$PORT/ 2>&1 || echo "FAIL")
    if echo "$HTTP_RESPONSE" | grep -q "<!DOCTYPE html"; then
      echo "   ✓ Service responding with HTML"
      
      # Double check: verify port is bound correctly
      if lsof -i :$PORT | grep -q "LISTEN"; then
        echo "   ✓ Port $PORT listening"
        SUCCESS=1
        break
      fi
    else
      echo "   Waiting for valid HTTP response..."
    fi
  elif [ "$STATUS" = "errored" ] || [ "$RESTARTS" -ge 10 ]; then
    echo ""
    echo "   ❌ Service failed (status: $STATUS, restarts: $RESTARTS)!"
    echo ""
    pm2 status
    echo ""
    echo "Error logs:"
    pm2 logs $APP_NAME --err --lines 50 --nostream 2>/dev/null || true
    echo ""
    echo "   Run: ./fix-zombie.sh"
    exit 1
  else
    echo "   Waiting... (status: $STATUS, restarts: $RESTARTS)"
  fi
  
  RETRY=$((RETRY + 1))
  sleep 3
done

if [ $SUCCESS -eq 0 ]; then
  echo ""
  echo "   ⚠️  Health check timeout (but service may still be starting)..."
  pm2 status
  echo ""
  echo "   Checking final status..."
  FINAL_STATUS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
  
  if [ "$FINAL_STATUS" = "online" ]; then
    echo "   ℹ️  Service is online. If you encounter issues, run: ./fix-zombie.sh"
    SUCCESS=1
  else
    echo "   ❌ Service failed to start!"
    pm2 logs $APP_NAME --lines 50 --nostream
    echo ""
    echo "   Run: ./fix-zombie.sh"
    exit 1
  fi
fi
echo ""

# Step 8: Save PM2 state
echo "8️⃣ Saving PM2 state..."
pm2 save
echo "   ✓ Saved"
echo ""

echo "════════════════════════════════════════"
echo "  ✅ Deployment Successful!"
echo "════════════════════════════════════════"
echo ""
pm2 status
echo ""
echo "🌐 Test URLs:"
echo "   Local:  http://localhost:$PORT/"
echo "   Online: https://hackathon.com.tw/"
echo ""
echo "📊 Check logs: pm2 logs $APP_NAME"
echo "⚠️  Remember: Ctrl+Shift+R to refresh browser"
echo ""
