#!/bin/bash
# Auto-Safe Deploy for Dev
# Usage: ./deploy-dev.sh

set -e

DEV_DIR="/home/reyerchu/hack/hack-dev"

cd "$DEV_DIR"

echo "🔄 Auto-deploying to dev (3009)..."

# Pull & Build
git pull origin dev
rm -rf .next node_modules/.cache
npm run build

# Restart
pm2 restart hackportal-dev

# Verify
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3009)

if [ "$STATUS" = "200" ]; then
    echo "✅ Deploy SUCCESS - Dev site online at http://localhost:3009"
else
    echo "❌ Deploy FAILED - Check logs: pm2 logs hackportal-dev"
    exit 1
fi

