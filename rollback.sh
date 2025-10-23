#!/bin/bash
# Quick Rollback - Use latest backup

set -e

PROD_DIR="/home/reyerchu/hack/hack"
LATEST_BACKUP=$(ls -td /home/reyerchu/hack/hack-backup-* 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ] || [ ! -d "$LATEST_BACKUP/.next" ]; then
    echo "❌ No backup found"
    exit 1
fi

echo "🔄 Rolling back to: $LATEST_BACKUP"

cd "$PROD_DIR"
pm2 stop hackportal 2>/dev/null || true
rm -rf .next
cp -r "$LATEST_BACKUP/.next" .
pm2 restart hackportal

sleep 3
echo "✅ Rollback complete"
pm2 list
