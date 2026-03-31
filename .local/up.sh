#!/bin/bash

# This script sets up the local environment
# Run from the root of the repo with `sh .local/up.sh`

cd $( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

# Start containers
docker compose \
  -f infra.yaml \
  -f postgres/setup.yaml \
  -f services.yaml \
  -p lockerhub \
  up -d --build

# Shim to avoid race condition
docker wait lockerhub-postgres-setup-complete-1 > /dev/null

# Remove setup containers
docker rm -f lockerhub-postgres-setup-1 lockerhub-postgres-setup-complete-1 2>/dev/null || true
