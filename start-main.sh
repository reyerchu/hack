#!/bin/bash

# Main Branch Startup Script
# This script starts the main branch on port 3008

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🚀 Starting Main Branch on Port 3008                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if port 3008 is already in use
if lsof -Pi :3008 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3008 is already in use!"
    echo "   Killing existing process..."
    lsof -ti:3008 | xargs kill -9
    sleep 2
fi

# Check if we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Error: Not on main branch!"
    echo "   Current branch: $BRANCH"
    echo "   Please switch to main branch: git checkout main"
    exit 1
fi

echo "✅ Branch: $BRANCH"
echo "✅ Port: 3008"
echo ""
echo "Starting server..."
echo ""

# Start the main server on port 3008
PORT=3008 npm start


