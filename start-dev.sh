#!/bin/bash

# Dev Branch Startup Script
# This script starts the dev branch on port 3009
# DO NOT merge this to main branch

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🚀 Starting Dev Branch on Port 3009                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if port 3009 is already in use
if lsof -Pi :3009 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3009 is already in use!"
    echo "   Killing existing process..."
    lsof -ti:3009 | xargs kill -9
    sleep 2
fi

# Check if we're on dev branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "dev" ]; then
    echo "❌ Error: Not on dev branch!"
    echo "   Current branch: $BRANCH"
    echo "   Please switch to dev branch: git checkout dev"
    exit 1
fi

echo "✅ Branch: $BRANCH"
echo "✅ Port: 3009"
echo ""
echo "Starting server..."
echo ""

# Start the dev server on port 3009
PORT=3009 npm start


