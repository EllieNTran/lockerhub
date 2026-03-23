# Authentication Service Tests

Comprehensive unit and integration test suite for the Auth Service using Vitest and Supertest.

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

## Test Patterns

### Unit Tests

Unit tests focus on individual services in isolation with mocked dependencies.

### Integration Tests

Integration tests use `supertest` to test HTTP endpoints end-to-end.
