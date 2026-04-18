#!/bin/bash

# K6 Performance Test Runner
# Usage: ./run-test.sh [test-name] [options]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create results directory if it doesn't exist
mkdir -p results

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_info "Please update .env with your configuration and run again."
    exit 0
fi

# Test name (default to core-api)
TEST_NAME=${1:-core-api}
TEST_FILE="tests/${TEST_NAME}.test.js"

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    print_error "Test file not found: $TEST_FILE"
    echo ""
    echo "Available tests:"
    ls -1 tests/*.test.js | xargs -n 1 basename | sed 's/.test.js//'
    exit 1
fi

print_info "Running k6 performance test: $TEST_NAME"
print_info "Test file: $TEST_FILE"

# Additional k6 options
K6_OPTIONS=${2:-""}

# Run the test
docker compose run --rm k6 run $K6_OPTIONS /scripts/${TEST_NAME}.test.js

print_info "Test completed. Results saved to results/${TEST_NAME}-summary.json"
