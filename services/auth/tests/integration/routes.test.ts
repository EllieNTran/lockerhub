/**
 * Integration tests for authentication routes
 * Using supertest to test Express routes end-to-end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import authRouter from '../../src/routes/auth'
import * as authService from '../../src/services/auth'
import * as tokenService from '../../src/services/token'
import { createMockUser, validSignupData, validCredentials } from '../fixtures'

interface MockError extends Error {
  status?: number
  code?: string
}

const app = express()
app.use(express.json())
app.use('/auth', authRouter)

// Mock the auth services
vi.mock('../../src/services/auth')
vi.mock('../../src/services/token')
vi.mock('../../src/connectors/db')

describe('Auth Routes Integration Tests', () => {
  describe('POST /auth/signup', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully register a new user', async () => {
      /**
       * Verify end-to-end signup flow through HTTP endpoint.
       * Mock service returns successful signup response.
       * Expect 201 status with tokens.
       */
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-id',
          email: validSignupData.email,
          role: 'user',
          firstName: validSignupData.firstName,
          lastName: validSignupData.lastName,
          hasSeenTutorial: false,
        },
      }

      vi.mocked(authService.signup).mockResolvedValue(mockResponse)

      const response = await request(app).post('/auth/signup').send(validSignupData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user).toHaveProperty('email', validSignupData.email)
    })

    it('should return 409 for existing email', async () => {
      /**
       * Verify error handling for duplicate signups.
       * Mock service throws conflict error.
       */
      const error: MockError = new Error('User with this email already exists')
      error.status = 409

      vi.mocked(authService.signup).mockRejectedValue(error)

      const response = await request(app).post('/auth/signup').send(validSignupData)

      expect(response.status).toBe(409)
    })

    it('should return 400 for missing required fields', async () => {
      /**
       * Verify validation for required fields.
       * Mock service throws validation error.
       */
      const error: MockError = new Error('First name, last name, email, and password are required')
      error.status = 400

      vi.mocked(authService.signup).mockRejectedValue(error)

      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com' })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully login with valid credentials', async () => {
      /**
       * Verify end-to-end login flow through HTTP endpoint.
       * Mock service returns successful login response.
       * Expect 200 status with tokens.
       */
      const mockUser = createMockUser({ email: validCredentials.email })
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: mockUser.user_id,
          email: mockUser.email,
          role: mockUser.role,
          firstName: mockUser.first_name,
          lastName: mockUser.last_name,
          hasSeenTutorial: mockUser.has_seen_tutorial,
        },
      }

      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      const response = await request(app).post('/auth/login').send(validCredentials)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user).toHaveProperty('email', validCredentials.email)
    })

    it('should return 401 for invalid credentials', async () => {
      /**
       * Verify authentication failure handling.
       * Mock service throws unauthorized error.
       */
      const error: MockError = new Error('Invalid email or password')
      error.status = 401

      vi.mocked(authService.login).mockRejectedValue(error)

      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for unactivated account', async () => {
      /**
       * Verify pre-registered account handling.
       * Mock service throws forbidden error with specific code.
       */
      const error: MockError = new Error('Account not activated')
      error.status = 403
      error.code = 'ACCOUNT_NOT_ACTIVATED'

      vi.mocked(authService.login).mockRejectedValue(error)

      const response = await request(app).post('/auth/login').send(validCredentials)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /auth/refresh', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully refresh access token', async () => {
      /**
       * Verify token refresh endpoint.
       * Mock service returns new access token.
       */
      const mockResponse = {
        accessToken: 'new-access-token',
      }

      vi.mocked(authService.refresh).mockResolvedValue(mockResponse)

      const response = await request(app).post('/auth/refresh').send({
        refreshToken: 'valid-refresh-token',
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('accessToken', 'new-access-token')
    })

    it('should return 401 for invalid refresh token', async () => {
      /**
       * Verify error handling for invalid tokens.
       * Mock service throws unauthorized error.
       */
      const error: MockError = new Error('Invalid or expired refresh token')
      error.status = 401

      vi.mocked(authService.refresh).mockRejectedValue(error)

      const response = await request(app).post('/auth/refresh').send({
        refreshToken: 'invalid-token',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully logout user', async () => {
      /**
       * Verify logout endpoint.
       * Mock service returns success message.
       */
      const mockResponse = {
        message: 'Logged out successfully',
      }

      vi.mocked(authService.logout).mockResolvedValue(mockResponse)

      const response = await request(app).post('/auth/logout').send({
        refreshToken: 'some-refresh-token',
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Logged out successfully')
    })
  })

  describe('GET /auth/.well-known/jwks.json', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return JWKS', async () => {
      /**
       * Verify JWKS endpoint for JWT verification.
       * Mock service returns JSON Web Key Set.
       */
      const mockJWKS = {
        keys: [{ kty: 'RSA', kid: 'key-id', use: 'sig', alg: 'RS256', n: 'modulus', e: 'exponent' }],
      }

      vi.mocked(tokenService.getJWKS).mockReturnValue(mockJWKS)

      const response = await request(app).get('/auth/.well-known/jwks.json')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('keys')
    })
  })
})
