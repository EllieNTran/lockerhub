#!/bin/bash

# Script to process floor queues and auto-allocate lockers
# This script should be run periodically to automatically
# allocate available lockers to users in the waitlist

BOOKING_SERVICE_URL="${BOOKING_SERVICE_URL:-http://localhost:3002}"
ENDPOINT="/bookings/queues/process"

echo "[$(date)] Processing floor queues..."
response=$(curl -s -X POST "${BOOKING_SERVICE_URL}${ENDPOINT}" \
  -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
  echo "[$(date)] Response: $response"

  if command -v jq &> /dev/null; then
    allocations=$(echo "$response" | jq -r '.allocations_made')
    echo "[$(date)] Allocations made: $allocations"
  fi
else
  echo "[$(date)] Error: Failed to call API endpoint"
  exit 1
fi
