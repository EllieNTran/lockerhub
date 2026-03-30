/**
 * Integration tests for service proxy routing
 * Tests request proxying to backend microservices
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import apiRoutes from '../../src/server/routes/api'
import { errorHandler } from '../../src/middleware/error-handler'
import * as verifyJwt from '../../src/utils/verify-jwt'
import * as servicesConnector from '../../src/connectors/services'

// Mock dependencies
vi.mock('../../src/utils/verify-jwt')
vi.mock('../../src/logger', () => ({
  default: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock the http-proxy-middleware
vi.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: vi.fn(() => (req: Request, res: Response, next: NextFunction) => {
    // Mock proxy middleware - just return success
    res.status(200).json({ proxied: true, service: req.baseUrl })
    next()
  }),
}))

const createTestApp = () => {
  const app = express()
  app.use(express.json())

  // Add mock logger
  app.use((req: any, _res: Response, next) => {
    req.log = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }
    next()
  })

  app.use('/api', apiRoutes)
  app.use(errorHandler)

  return app
}

describe('Proxy Routing Integration Tests', () => {
  let app: express.Application

  const mockValidToken = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'user',
    departmentId: 'dept-1',
    scope: 'access',
    iss: 'lockerhub-auth',
    aud: ['lockerhub-api'],
    jti: 'jwt-id-123',
    sub: 'user-123',
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
    iat: Math.floor(Date.now() / 1000),
  }

  const mockAdminToken = {
    ...mockValidToken,
    userId: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
    departmentId: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('public auth routes', () => {
    it('should allow access to /api/auth/login without authentication', async () => {
      /**
       * Verify public auth endpoints accessible without JWT.
       * Login endpoint should not require authentication.
       * Expect successful proxy without auth header.
       */
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })

      expect(response.status).toBe(200)
    })

    it('should allow access to /api/auth/signup without authentication', async () => {
      /**
       * Verify signup endpoint accessible without JWT.
       * Expect successful proxy without auth header.
       */
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'password' })

      expect(response.status).toBe(200)
    })

    it('should allow access to /api/auth/password-reset without authentication', async () => {
      /**
       * Verify password reset endpoint accessible without JWT.
       * Expect successful proxy without auth header.
       */
      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({ email: 'test@example.com' })

      expect(response.status).toBe(200)
    })
  })

  describe('authenticated routes', () => {
    it('should proxy authenticated booking requests with valid token', async () => {
      /**
       * Verify authenticated routes require valid JWT.
       * Mock JWKS verification returns valid token.
       * Expect successful proxy to booking service.
       */
      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockValidToken)

      const response = await request(app)
        .get('/api/bookings/lockers')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(verifyJwt.verifyTokenWithJWKS).toHaveBeenCalledWith('valid-token')
    })

    it('should reject booking requests without authentication', async () => {
      /**
       * Verify booking endpoints reject unauthenticated requests.
       * Expect 401 status without auth header.
       */
      const response = await request(app).get('/api/bookings/lockers')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('code', 'MISSING_TOKEN')
    })
  })

  describe('admin-only routes', () => {
    it('should allow admin access to admin endpoints', async () => {
      /**
       * Verify admin endpoints accessible with admin role.
       * Mock JWKS verification returns admin token.
       * Expect successful proxy to admin service.
       */
      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockAdminToken)

      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', 'Bearer admin-token')

      expect(response.status).toBe(200)
    })

    it('should deny non-admin access to admin endpoints', async () => {
      /**
       * Verify admin endpoints reject non-admin users.
       * Mock JWKS verification returns regular user token.
       * Expect 403 forbidden status.
       */
      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockValidToken)

      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', 'Bearer user-token')

      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('code', 'FORBIDDEN')
    })

    it('should allow admin access to analytics endpoints', async () => {
      /**
       * Verify analytics endpoints require admin role.
       * Mock JWKS verification returns admin token.
       * Expect successful proxy to analytics service.
       */
      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockAdminToken)

      const response = await request(app)
        .get('/api/analytics/locker-usage')
        .set('Authorization', 'Bearer admin-token')

      expect(response.status).toBe(200)
    })

    it('should deny non-admin access to analytics endpoints', async () => {
      /**
       * Verify analytics endpoints reject non-admin users.
       * Expect 403 forbidden status.
       */
      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockValidToken)

      const response = await request(app)
        .get('/api/analytics/locker-usage')
        .set('Authorization', 'Bearer user-token')

      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('code', 'FORBIDDEN')
    })
  })

  describe('service configuration', () => {
    it('should have correct service URL configurations', () => {
      /**
       * Verify service configuration contains expected settings.
       * Check that all required services are configured.
       */
      const config = servicesConnector.SERVICE_CONFIG

      expect(config).toHaveProperty('auth')
      expect(config).toHaveProperty('booking')
      expect(config).toHaveProperty('admin')
      expect(config).toHaveProperty('notifications')
      expect(config).toHaveProperty('analytics')

      expect(config.auth).toHaveProperty('url')
      expect(config.auth).toHaveProperty('prefix', '/auth')
      expect(config.booking.prefix).toBe('/bookings')
      expect(config.admin.prefix).toBe('/admin')
    })
  })

  describe('health check endpoint', () => {
    it('should return health status without authentication', async () => {
      /**
       * Verify gateway health endpoint accessible without auth.
       * Expect 200 status with health information.
       */
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
    })
  })
})
