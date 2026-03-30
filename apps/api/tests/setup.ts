/**
 * Test setup file - runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3000'
process.env.WEBAPP_URL = 'http://localhost:3001'
process.env.AUTH_SERVICE_URL = 'http://localhost:3003'
process.env.BOOKING_SERVICE_URL = 'http://localhost:3004'
process.env.ADMIN_SERVICE_URL = 'http://localhost:3005'
process.env.NOTIFICATIONS_SERVICE_URL = 'http://localhost:3006'
