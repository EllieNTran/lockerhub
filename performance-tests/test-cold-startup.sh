#!/bin/bash

# Test Cold Startup Performance
# This script stops all services, starts them fresh, and measures startup time

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

print_header "Cold Startup Performance Test"
echo ""
print_info "Project root: $PROJECT_ROOT"
echo ""

# Docker Compose settings for LockerHub services
# Skip postgres setup for performance testing (DB should already be initialized)
COMPOSE_FILES="-f .local/infra.yaml -f .local/services.yaml"
PROJECT_NAME="lockerhub"

# Step 1: Stop all services
print_header "Step 1: Stopping All Services"
echo ""
print_info "Running: docker compose down (project: $PROJECT_NAME)"

cd "$PROJECT_ROOT"

if docker compose $COMPOSE_FILES -p $PROJECT_NAME down; then
    print_info "All services stopped successfully"
else
    print_warning "Services may not have been running"
fi

echo ""
sleep 2

# Step 2: Start services fresh
print_header "Step 2: Starting Services (Cold Start)"
echo ""
print_info "Running: docker compose up -d --build (project: $PROJECT_NAME)"

START_TIME=$(date +%s)

# Start services - postgres-setup may fail if DB already initialized
if docker compose $COMPOSE_FILES -p $PROJECT_NAME up -d --build 2>&1 | tee /tmp/compose-startup.log; then
    print_info "Services started in detached mode"
else
    # Check if only postgres-setup failed
    if grep -q "postgres-setup.*didn't complete successfully" /tmp/compose-startup.log; then
        print_warning "postgres-setup failed (database may already be initialized - continuing)"
    else
        print_error "Failed to start services"
        exit 1
    fi
fi

echo ""
print_info "Giving Docker a moment to initialize containers..."
sleep 5

echo ""

# Step 3: Run startup test
print_header "Step 3: Measuring Startup Time"
echo ""

cd "$PROJECT_ROOT/performance-tests"

if ./run-test.sh health-check; then
    print_info "Health check completed successfully"
    EXIT_CODE=0
else
    print_error "Health check failed"
    EXIT_CODE=1
fi

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo ""
print_header "Cold Startup Test Summary"
echo ""
print_info "Total time (including Docker initialization): ${TOTAL_TIME}s"
print_info "See results/health-check-summary.json for detailed metrics"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    print_info "All services started successfully within threshold"
else
    print_warning "Some services took longer than expected"
fi

echo ""
exit $EXIT_CODE
