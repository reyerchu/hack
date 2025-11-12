#!/bin/bash
# Emergency Fix: Kill zombie processes and restart service
# Use this when you see "EMPTY PAGE" or "EADDRINUSE" errors

set -e

APP_NAME="hackportal"
PORT=3008

echo "════════════════════════════════════════"
echo "  🚨 Emergency Fix: Zombie Process"
echo "════════════════════════════════════════"
echo ""

# Step 1: Check for zombie processes
echo "1️⃣ Checking for zombie processes on port $PORT..."
ZOMBIE_PIDS=$(lsof -ti :$PORT 2>/dev/null || true)

if [ -z "$ZOMBIE_PIDS" ]; then
  echo "   ✓ No zombie processes found"
else
  echo "   ⚠️  Found zombie processes: $ZOMBIE_PIDS"
  echo ""
  echo "2️⃣ Killing zombie processes..."
  echo "$ZOMBIE_PIDS" | xargs -r kill -9 2>/dev/null || true
  sleep 2
  echo "   ✓ Zombies killed"
fi
echo ""

# Step 2: Stop PM2
echo "3️⃣ Stopping PM2 service..."
pm2 stop $APP_NAME 2>/dev/null || echo "   (not running)"
echo "   ✓ Stopped"
echo ""

# Step 3: Delete PM2 instance
echo "4️⃣ Deleting PM2 instance..."
pm2 delete $APP_NAME 2>/dev/null || echo "   (no instance)"
echo "   ✓ Deleted"
echo ""

# Step 4: Final port check
echo "5️⃣ Final port verification..."
if lsof -i :$PORT >/dev/null 2>&1; then
  echo "   ⚠️  Port $PORT STILL occupied!"
  lsof -i :$PORT
  echo ""
  echo "   Force killing remaining processes..."
  lsof -ti :$PORT | xargs -r kill -9 2>/dev/null || true
  sleep 3
fi

if lsof -i :$PORT >/dev/null 2>&1; then
  echo "   ❌ FAILED to free port $PORT!"
  echo "   Manual intervention required."
  exit 1
fi
echo "   ✓ Port $PORT is free"
echo ""

# Step 5: Restart service
echo "6️⃣ Starting fresh PM2 instance..."
pm2 start ecosystem.config.js --env production
echo "   ✓ Started"
echo ""

# Step 6: Quick health check
echo "7️⃣ Quick health check..."
sleep 10

STATUS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
echo "   Status: $STATUS"

if [ "$STATUS" = "online" ]; then
  if curl -sf http://localhost:$PORT/ >/dev/null 2>&1; then
    echo "   ✓ Service responding (HTTP 200)"
  else
    echo "   ⚠️  Service online but not responding"
    echo "   Check logs: pm2 logs $APP_NAME"
  fi
else
  echo "   ⚠️  Service not online!"
  pm2 status
fi
echo ""

# Step 7: Save state
echo "8️⃣ Saving PM2 state..."
pm2 save
echo "   ✓ Saved"
echo ""

echo "════════════════════════════════════════"
echo "  ✅ Emergency Fix Complete!"
echo "════════════════════════════════════════"
echo ""
echo "🌐 Test: https://hackathon.com.tw/"
echo "📊 Logs: pm2 logs $APP_NAME"
echo "⚠️  Browser: Ctrl+Shift+R to force refresh"
echo ""

