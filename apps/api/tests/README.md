# API Gateway Tests

Integration test suite for the API Gateway using Vitest and Supertest.

## Dependencies

- **vitest** - Fast unit test framework with native TypeScript support
- **@vitest/ui** - Optional UI for viewing test results
- **supertest** - HTTP assertions for testing Express routes
- **@types/supertest** - TypeScript types for supertest

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Integration Tests

Integration tests use `supertest` to test HTTP endpoints end-to-end with mocked external dependencies.

**tests/integration/**
- `auth-middleware.test.ts` - JWT verification and role-based access control
- `proxy-routing.test.ts` - Service proxy routing
- `rate-limiting.test.ts` - Rate limiting enforcement

## Test Patterns

Tests verify:
- JWT token verification with JWKS
- Role-based authorization
- Error handling and status codes
- Request/response format validation

All external dependencies (JWKS fetching, service proxying) are mocked to keep tests fast and isolated.
