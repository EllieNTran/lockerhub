# Analytics Service Tests

Comprehensive unit and integration test suite for the Analytics Service using pytest.

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
pytest tests/unit/test_locker_usage.py

# Run with coverage
pytest --cov=src --cov-report=html
```

## Test Patterns

### Unit Tests

Unit tests focus on individual services in isolation with mocked dependencies. Located in `tests/unit/`, these tests verify business logic without HTTP overhead.

### Integration Tests

Integration tests use `httpx.AsyncClient` to test FastAPI endpoints end-to-end. Located in `tests/integration/`, these tests verify HTTP request/response handling, routing, and middleware behavior with mocked authentication.
