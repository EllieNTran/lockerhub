# Admin Service Tests

Comprehensive unit and integration test suite for the Admin Service using pytest.

## Dependencies

- **pytest** - Testing framework
- **pytest-asyncio** - Async test support
- **pytest-mock** - Mocking utilities
- **pytest-xdist** - Parallel test execution
- **httpx** - HTTP client for testing

## Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run only unit tests
pytest tests/unit/

# Run only integration tests
pytest tests/integration/

# Run specific test file
pytest tests/unit/lockers/test_create_locker.py
```

## Test Patterns

### Unit Tests

Unit tests focus on individual services in isolation with mocked dependencies. Located in `tests/unit/`, these tests verify business logic without HTTP overhead.

### Integration Tests

Integration tests use `httpx.AsyncClient` to test FastAPI endpoints end-to-end. Located in `tests/integration/`, these tests verify HTTP request/response handling, routing, and middleware behavior with mocked authentication.

## Test Coverage

The test suite covers:

### Integration Tests (`test_routes.py`)

#### User Endpoints
- ✅ GET /admin/users - Get all users
- ✅ GET /admin/users/{id} - Get user by ID
- ✅ Error handling (404 not found)

#### Locker Endpoints
- ✅ GET /admin/lockers - Get all lockers
- ✅ GET /admin/lockers/stats - Get locker statistics
- ✅ POST /admin/lockers/{id}/maintenance - Mark maintenance
- ✅ POST /admin/lockers - Create locker
- ✅ PATCH /admin/lockers/{id}/coordinates - Update coordinates
- ✅ GET /admin/lockers/keys - Get all keys

#### Booking Endpoints
- ✅ POST /admin/bookings - Create booking
- ✅ GET /admin/bookings - Get all bookings
- ✅ POST /admin/bookings/{id}/cancel - Cancel booking
- ✅ POST /admin/bookings/{id}/handover - Key handover
- ✅ POST /admin/bookings/{id}/return - Key return

#### Dashboard Endpoints
- ✅ GET /admin/dashboard/stats - Get dashboard statistics
- ✅ GET /admin/dashboard/floors/utilization - Get floor utilization
- ✅ GET /admin/dashboard/recent-activity - Get recent activity

#### Special Request Endpoints
- ✅ GET /admin/special-requests - Get all requests
- ✅ POST /admin/special-requests/{id}/review - Review request

#### Audit Endpoints
- ✅ GET /admin/audit - Get audit logs with pagination

#### Booking Rules Endpoints
- ✅ GET /admin/booking-rules/ - Get booking rules
- ✅ PUT /admin/booking-rules - Update booking rules
- ✅ PUT /admin/booking-rules/floors/{id}/status - Update floor status

