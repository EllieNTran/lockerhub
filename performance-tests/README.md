# LockerHub Performance Tests

K6 performance tests for LockerHub using API and browser-based testing.

## Prerequisites

- K6 installed (`brew install k6`)
- Docker running
- Test credentials in `.env` file

## Available Tests

### API Tests
- **health-check** - Verify all services are responding
- **core-api** - Test API endpoints under load (50 users)
- **concurrent-users** - Test with 50-70 concurrent users

### Browser Tests
- **page-loads-browser** - Test user/admin page navigation
- **browser-analytics** - Test analytics dashboard and filters

### System Tests
- **cold-startup** - Measure Docker startup time (<60s target)

## How to Run

### Run All API Tests
```bash
./run-all-tests.sh
```

### Run Individual Tests
```bash
./run-test.sh health-check
./run-test.sh core-api
./run-test.sh concurrent-users
```

### Run Browser Tests
```bash
./run-browser-test.sh           # Page loads
./run-analytics-browser-test.sh # Analytics dashboard
```

### Test System Startup
```bash
./test-cold-startup.sh
```

## Results

Results are saved in `results/` as JSON files.
