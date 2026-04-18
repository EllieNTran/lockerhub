#!/bin/bash

set -e

echo "Running K6 Analytics Dashboard Browser Test"
echo ""

if ! command -v k6 &> /dev/null; then
    echo "Error: K6 not found"
    echo "Install: brew install k6"
    exit 1
fi

if ! curl -s http://localhost:3001 > /dev/null; then
    echo "Error: Webapp not running on http://localhost:3001"
    echo "Start webapp: sh .local/up.sh"
    exit 1
fi

echo "Webapp detected on port 3001"
echo ""

if [ -f ".env" ]; then
    echo "Loading test credentials from .env"
    set -a
    source .env
    set +a
else
    echo "Warning: No .env file found"
fi
echo ""

K6_BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" k6 run tests/browser-analytics.test.js

echo ""
echo "Analytics dashboard test complete"
echo "Results saved to: results/browser-analytics-summary.json"
