#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: ./rebuild-service.sh <service-name>"
  echo "Services: api, auth, booking, admin, notifications"
  exit 1
fi

SERVICE=$1
cd "$(dirname "$0")"

# Check and start postgres if needed
if ! docker ps --format '{{.Names}}' | grep -q "lockerhub-postgres-1"; then
  if docker ps -a --format '{{.Names}}' | grep -q "lockerhub-postgres-1"; then
    docker start lockerhub-postgres-1 && sleep 3
  else
    docker compose -f infra.yaml -p lockerhub up -d postgres
  fi
fi

# Rebuild service
docker compose -f infra.yaml -f services.yaml -p lockerhub build --no-cache $SERVICE
docker compose -f infra.yaml -f services.yaml -p lockerhub up -d --force-recreate --no-deps $SERVICE

echo ""
echo "Logs: docker compose -f infra.yaml -f services.yaml -p lockerhub logs -f $SERVICE"
