/**
 * Integration tests for authentication middleware
 * Tests JWT verification with JWKS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Request, Response } from 'express'
import { authenticate, requireRole } from '../../src/middleware/auth'
import { errorHandler } from '../../src/middleware/error-handler'
import * as verifyJwt from '../../src/utils/verify-jwt'
import type { AuthenticatedRequest } from '../../src/types'

// Mock dependencies
vi.mock('../../src/utils/verify-jwt')
vi.mock('../../src/logger', () => ({
  default: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Create test app with auth middleware
const createTestApp = () => {
  const app = express()
  app.use(express.json())

  // Add mock logger to request
  app.use((req: any, _res: Response, next) => {
    req.log = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }
    next()
  })

  // Protected route that requires authentication
  // lgtm[js/missing-rate-limiting]
  app.get('/protected', authenticate, (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest
    res.json({
      message: 'Access granted',
      user: authReq.user,
    })
  })

  // Admin-only route
  // lgtm[js/missing-rate-limiting]
  app.get(
    '/admin-only',
    authenticate,
    requireRole('admin'),
    (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest
      res.json({
        message: 'Admin access granted',
        user: authReq.user,
      })
    },
  )

  app.use(errorHandler)

  return app
}

describe('Auth Middleware Integration Tests', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('authenticate middleware', () => {
    it('should allow access with valid JWT token', async () => {
      /**
       * Verify successful authentication with valid JWT.
       * Mock JWKS verification returns decoded token.
       * Expect 200 status with user data.
       */
      const mockDecodedToken = {
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

      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockDecodedToken)

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-jwt-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Access granted')
      expect(response.body.user).toEqual({
        userId: mockDecodedToken.userId,
        email: mockDecodedToken.email,
        role: mockDecodedToken.role,
        departmentId: mockDecodedToken.departmentId,
        scope: mockDecodedToken.scope,
      })
    })

    it('should reject request without authorization header', async () => {
      /**
       * Verify rejection when no authorization header provided.
       * Expect 401 status with appropriate error.
       */
      const response = await request(app).get('/protected')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('code', 'MISSING_TOKEN')
    })

    it('should reject request with malformed authorization header', async () => {
      /**
       * Verify rejection when authorization header format is invalid.
       * Expect 401 status.
       */
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('code', 'INVALID_TOKEN_FORMAT')
    })

    it('should reject request with expired token', async () => {
      /**
       * Verify rejection when JWT is expired.
       * Mock JWKS verification throws TokenExpiredError.
       * Expect 401 status with TOKEN_EXPIRED code.
       */
      const expiredError = new Error('jwt expired')
      expiredError.name = 'TokenExpiredError'

      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockRejectedValue(expiredError)

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer expired-token')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('code', 'TOKEN_EXPIRED')
    })

    it('should reject request with invalid token signature', async () => {
      /**
       * Verify rejection when JWT signature is invalid.
       * Mock JWKS verification throws generic error.
       * Expect 401 status.
       */
      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockRejectedValue(
        new Error('invalid signature'),
      )

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('code', 'INVALID_TOKEN')
    })
  })

  describe('requireRole middleware', () => {
    it('should allow access when user has required role', async () => {
      /**
       * Verify RBAC grants access to admin user.
       * Mock JWKS verification returns admin token.
       * Expect 200 status.
       */
      const mockAdminToken = {
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        departmentId: null,
        scope: 'access',
        iss: 'lockerhub-auth',
        aud: ['lockerhub-api'],
        jti: 'jwt-id-456',
        sub: 'admin-123',
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iat: Math.floor(Date.now() / 1000),
      }

      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockAdminToken)

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', 'Bearer admin-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Admin access granted')
    })

    it('should deny access when user lacks required role', async () => {
      /**
       * Verify RBAC denies access to non-admin user.
       * Mock JWKS verification returns user token.
       * Expect 403 status.
       */
      const mockUserToken = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'user',
        departmentId: 'dept-1',
        scope: 'access',
        iss: 'lockerhub-auth',
        aud: ['lockerhub-api'],
        jti: 'jwt-id-789',
        sub: 'user-123',
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iat: Math.floor(Date.now() / 1000),
      }

      vi.mocked(verifyJwt.verifyTokenWithJWKS).mockResolvedValue(mockUserToken)

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', 'Bearer user-token')

      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('code', 'FORBIDDEN')
    })
  })
})
