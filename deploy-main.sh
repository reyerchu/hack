#!/bin/bash
# Auto-Safe Deploy for Main (Production)
# Usage: ./deploy-main.sh

set -e

PROD_DIR="/home/reyerchu/hack/hack"
BACKUP_DIR="/home/reyerchu/hack/hack-backup-$(date +%Y%m%d-%H%M%S)"

cd "$PROD_DIR"

echo "🔄 Auto-deploying to production (3008)..."

# 1. Backup
mkdir -p "$BACKUP_DIR"
if [ -d ".next" ]; then
    cp -r .next "$BACKUP_DIR/"
    echo "✓ Backup: $BACKUP_DIR"
fi

# 2. Pull & Build
git pull origin main
rm -rf .next node_modules/.cache
npm run build

# 3. Restart
pm2 delete hackportal 2>/dev/null || true
sleep 2
lsof -ti:3008 | xargs kill -9 2>/dev/null || true
sleep 1
pm2 start npm --name hackportal -- start -- -p 3008

# 4. Wait & Verify
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3008)

if [ "$STATUS" = "200" ]; then
    echo "✅ Deploy SUCCESS - Site online"
    rm -rf "$BACKUP_DIR"
else
    echo "❌ Deploy FAILED - Rolling back..."
    rm -rf .next
    cp -r "$BACKUP_DIR/.next" .
    pm2 restart hackportal
    echo "✓ Rollback complete"
    exit 1
fi

