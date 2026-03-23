/**
 * Test setup file - runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-purposes-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only'
process.env.JWT_ACCESS_EXPIRY = '15m'
process.env.JWT_REFRESH_EXPIRY = '7d'
