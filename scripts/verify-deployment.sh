#!/bin/bash

# Deployment Verification Script
# Checks if Firebase Admin SDK is working after deployment

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🔍 Verifying Deployment Health                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if service is running
echo "📋 Step 1: Checking if service is running..."
if curl -s http://localhost:3008 > /dev/null; then
    echo -e "${GREEN}✅ Service is running${NC}"
else
    echo -e "${RED}❌ Service is NOT running!${NC}"
    echo "   Run: npm start"
    exit 1
fi
echo ""

# Check Firebase Admin SDK health
echo "📋 Step 2: Checking Firebase Admin SDK..."
HEALTH_CHECK=$(curl -s http://localhost:3008/api/health)
STATUS=$(echo "$HEALTH_CHECK" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ Firebase Admin SDK is working${NC}"
    echo "$HEALTH_CHECK" | python3 -m json.tool || echo "$HEALTH_CHECK"
else
    echo -e "${RED}❌ Firebase Admin SDK FAILED!${NC}"
    echo "$HEALTH_CHECK" | python3 -m json.tool || echo "$HEALTH_CHECK"
    echo ""
    echo -e "${RED}🚨 CRITICAL: Users will be redirected to /register on login!${NC}"
    echo ""
    echo "Fix: Check CRITICAL-FIREBASE-FIX.md for solution"
    exit 1
fi
echo ""

# Check if homepage loads
echo "📋 Step 3: Checking homepage..."
if curl -s http://localhost:3008 | grep -q "RWA"; then
    echo -e "${GREEN}✅ Homepage is loading correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Homepage may not be loading correctly${NC}"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          ✅ Deployment Verification PASSED                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Service is running on http://localhost:3008"
echo "✅ Firebase Admin SDK is working"
echo "✅ Ready for production deployment"
echo ""
echo "Next steps:"
echo "  1. Test login with a user account"
echo "  2. Deploy to production: ./deploy.sh"
echo "  3. Run health check on production: curl https://hackathon.com.tw/api/health"
echo ""

