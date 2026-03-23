# Notifications Service Tests

Comprehensive unit and integration test suite for the Notifications Service using Vitest and Supertest.

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

## Test Coverage

The test suite covers:

### Notification Services (`notifications.test.ts`)
- ✅ Create global notifications
- ✅ Create user-scoped notifications
- ✅ Create department-scoped notifications
- ✅ Transaction rollback on errors
- ✅ Mark notifications as read
- ✅ Retrieve user notifications
- ✅ Filter unread notifications
- ✅ Count unread notifications

### Email Services (`auth.test.ts`)
- ✅ Send password reset emails
- ✅ Send activation emails
- ✅ Error handling for email failures

### Route Integration (`routes.test.ts`)
- ✅ POST /notifications/password-reset endpoint
- ✅ POST /notifications/activation endpoint
- ✅ GET /notifications/health endpoint
- ✅ POST /notifications endpoint (create)
- ✅ PATCH /notifications/:id/read endpoint
- ✅ GET /notifications/user/:userId endpoint
