/**
 * K6 Performance Test Configuration
 * Environment variables that can be overridden when running tests
 */

export const config = {
  // Base URLs for services (based on .local/services.yaml port mappings)
  API_BASE_URL: __ENV.API_BASE_URL || 'http://host.docker.internal:3002',
  AUTH_BASE_URL: __ENV.AUTH_BASE_URL || 'http://host.docker.internal:3003',
  BOOKING_BASE_URL: __ENV.BOOKING_BASE_URL || 'http://host.docker.internal:3004',
  ADMIN_BASE_URL: __ENV.ADMIN_BASE_URL || 'http://host.docker.internal:3005',
  ANALYTICS_BASE_URL: __ENV.ANALYTICS_BASE_URL || 'http://host.docker.internal:3007',
  NOTIFICATIONS_BASE_URL: __ENV.NOTIFICATIONS_BASE_URL || 'http://host.docker.internal:3006',
  WEBAPP_BASE_URL: __ENV.WEBAPP_BASE_URL || 'http://host.docker.internal:3001',

  // Performance thresholds
  thresholds: {
    generalPageLoad: 3000,        // 2-3 seconds for general pages
    coreApiResponse: 2000,        // 1-2 seconds for core API endpoints
    analyticsDashboard: 6000,     // 4-6 seconds for analytics dashboard
    analyticsFiltered: 4000,      // 3-4 seconds for filtered results
    startupTime: 60000,           // 60 seconds for Docker startup
  },

  // Test user credentials
  testUser: {
    email: __ENV.TEST_USER_EMAIL || 'test.user@example.com',
    password: __ENV.TEST_USER_PASSWORD || 'testpassword123',
  },

  testAdmin: {
    email: __ENV.TEST_ADMIN_EMAIL || 'admin@example.com',
    password: __ENV.TEST_ADMIN_PASSWORD || 'adminpassword123',
  },

  // Load test parameters
  load: {
    normalUsers: 50,              // 50 concurrent users for normal usage
    peakUsers: 100,               // 100 concurrent users for peak testing
    rampUpTime: '30s',            // Time to ramp up to target users
    steadyStateDuration: '2m',    // How long to maintain load
    rampDownTime: '30s',          // Time to ramp down
  },
}

export default config
