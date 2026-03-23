# Booking Service Tests

Comprehensive unit and integration test suite for the Booking Service using pytest.

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
pytest tests/unit/test_bookings.py
```

## Test Patterns

### Unit Tests

Unit tests focus on individual services in isolation with mocked dependencies. Located in `tests/unit/`, these tests verify business logic without HTTP overhead.

### Integration Tests

Integration tests use `httpx.AsyncClient` to test FastAPI endpoints end-to-end. Located in `tests/integration/`, these tests verify HTTP request/response handling, routing, and middleware behavior with mocked authentication.

## Test Coverage

The test suite covers:

### Unit Tests

#### Booking Services (`test_bookings.py`)
- ✅ Create bookings with validation
- ✅ Overlapping booking detection
- ✅ Get booking by ID
- ✅ Get user bookings
- ✅ Cancel bookings
- ✅ Extend bookings
- ✅ Unauthorized access handling

#### Locker Services (`test_lockers.py`)
- ✅ Get available lockers
- ✅ Filter by size (small, medium, large)
- ✅ Filter by department
- ✅ Check locker availability
- ✅ Handle occupied lockers
- ✅ Permanently allocated lockers
- ✅ Handle unavailable floors

#### Floor Services (`test_floors.py`)
- ✅ Get all floors
- ✅ Get floor by ID
- ✅ Get floor statistics
- ✅ Handle non-existent floors

#### Queue Services (`test_queues.py`)
- ✅ Join waiting list
- ✅ Get user queue position
- ✅ Leave waiting list
- ✅ Process waiting lists
- ✅ Duplicate entry prevention
- ✅ Waitlist for different departments

### Integration Tests (`test_routes.py`)

#### Booking Endpoints
- ✅ POST /bookings - Create booking
- ✅ GET /bookings - Get user bookings
- ✅ GET /bookings/{id} - Get booking by ID
- ✅ PUT /bookings/{id} - Update booking
- ✅ PUT /bookings/{id}/cancel - Cancel booking
- ✅ POST /bookings/{id}/extend - Extend booking
- ✅ Error handling (409 conflicts, 404 not found)

#### Locker Endpoints
- ✅ GET /bookings/lockers/available - Get available lockers
- ✅ GET /bookings/lockers/{id}/availability - Check availability

#### Floor Endpoints
- ✅ GET /bookings/floors - Get all floors

#### Waitlist Endpoints
- ✅ POST /bookings/waitlist/join - Join waitlist
- ✅ POST /bookings/queues/process - Process queues
