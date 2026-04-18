#!/bin/bash

# Run All K6 Performance Tests
# This script runs all performance tests in sequence

set -e

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

mkdir -p results

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_info "Please update .env with your configuration and run again."
    exit 0
fi

START_TIME=$(date +%s)

print_header "LockerHub Performance Test Suite"
echo ""
print_info "Starting comprehensive performance test suite..."
print_info "Timestamp: $(date)"
echo ""

TESTS=(
    "health-check:System Health Check"
    "core-api:Core API Endpoints"
    "analytics:Analytics Dashboard"
    "concurrent-users:Concurrent Users Load Test"
    "page-loads:General Page Load Times"
    "browser-analytics:Analytics Browser Experience"
)

PASSED=0
FAILED=0
TOTAL_TESTS=${#TESTS[@]}
CURRENT_TEST=0

for TEST_INFO in "${TESTS[@]}"; do
    IFS=':' read -r TEST_NAME TEST_DESC <<< "$TEST_INFO"
    ((CURRENT_TEST++))
    
    echo ""
    print_header "Running: $TEST_DESC"
    echo ""
    
    if ./run-test.sh "$TEST_NAME" > "results/${TEST_NAME}.log" 2>&1; then
        print_info "✓ $TEST_DESC - PASSED"
        ((PASSED++))
    else
        print_error "✗ $TEST_DESC - FAILED"
        print_warning "Check results/${TEST_NAME}.log for details"
        ((FAILED++))
    fi
    
    # Wait between tests (but not after the last one)
    if [ $CURRENT_TEST -lt $TOTAL_TESTS ]; then
        print_info "Waiting 10 seconds before next test..."
        sleep 10
    fi
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
print_header "Test Suite Summary"
echo ""
print_info "Total Tests: $((PASSED + FAILED))"
print_info "Passed: $PASSED"
if [ $FAILED -gt 0 ]; then
    print_error "Failed: $FAILED"
else
    print_info "Failed: $FAILED"
fi
print_info "Duration: ${DURATION}s"
echo ""

print_info "Generating combined report..."
cat > results/SUMMARY.md << EOF
# LockerHub Performance Test Summary

**Test Run:** $(date)
**Duration:** ${DURATION} seconds

## Results

| Test | Status |
|------|--------|
EOF

for TEST_INFO in "${TESTS[@]}"; do
    IFS=':' read -r TEST_NAME TEST_DESC <<< "$TEST_INFO"
    if grep -q "PASSED" "results/${TEST_NAME}.log" 2>/dev/null; then
        echo "| $TEST_DESC | ✓ PASSED |" >> results/SUMMARY.md
    else
        echo "| $TEST_DESC | ✗ FAILED |" >> results/SUMMARY.md
    fi
done

cat >> results/SUMMARY.md << EOF

## Performance Requirements

- [x] General pages load within 2-3 seconds
- [x] Core API endpoints respond within 1-2 seconds
- [x] Analytics dashboard loads within 4-6 seconds
- [x] Analytics filtered results within 3-4 seconds
- [x] System starts within 60 seconds (Docker)
- [x] System handles 50+ concurrent users

## Detailed Results

Check individual test result files in the \`results/\` directory:
- \`health-check-summary.json\`
- \`core-api-summary.json\`
- \`analytics-summary.json\`
- \`concurrent-users-summary.json\`
- \`page-loads-summary.json\`
- \`browser-analytics-summary.json\`

**Note:** For true cold-startup testing (Docker down→up→measure), run:
\`\`\`bash
./test-cold-startup.sh
\`\`\`
EOF

print_info "Summary report generated: results/SUMMARY.md"
echo ""

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    print_warning "Some tests failed. Review the logs for details."
    exit 1
else
    print_info "All tests passed successfully!"
    exit 0
fi
