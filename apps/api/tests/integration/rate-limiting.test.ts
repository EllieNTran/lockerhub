/**
 * Integration tests for rate limiting
 * Tests rate limit enforcement on API gateway
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { errorHandler } from '../../src/middleware/error-handler'

// Mock dependencies
vi.mock('../../src/logger', () => ({
  default: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const createTestApp = () => {
  const app = express()
  app.use(express.json())

  app.use((req: any, _res: Response, next) => {
    req.log = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }
    next()
  })

  // Apply rate limiter to /api/* routes
  // Using smaller limits for testing: 5 requests per minute
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per window per IP
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  })

  app.use('/api/', limiter)

  app.get('/api/test', (_req: Request, res: Response) => {
    res.json({ message: 'Success' })
  })

  app.use(errorHandler)

  return app
}

describe('Rate Limiting Integration Tests', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('request limiting', () => {
    it('should allow requests within rate limit', async () => {
      /**
       * Verify requests under the rate limit are allowed.
       * Make 3 requests (under limit of 5).
       * Expect all requests to succeed with 200 status.
       */
      const responses = await Promise.all([
        request(app).get('/api/test'),
        request(app).get('/api/test'),
        request(app).get('/api/test'),
      ])

      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Success')
      })
    })

    it('should return rate limit headers in response', async () => {
      /**
       * Verify rate limit headers present in responses.
       * Check for RateLimit-* headers as per RFC draft.
       * Expect headers showing limit and remaining requests.
       */
      const response = await request(app).get('/api/test')

      expect(response.status).toBe(200)
      expect(response.headers).toHaveProperty('ratelimit-limit')
      expect(response.headers).toHaveProperty('ratelimit-remaining')
      expect(response.headers).toHaveProperty('ratelimit-reset')
    })

    it('should block requests exceeding rate limit', async () => {
      /**
       * Verify requests exceeding rate limit are blocked.
       * Make 6 requests (over limit of 5).
       * Expect first 5 to succeed, 6th to return 429.
       */
      const responses = []

      for (let i = 0; i < 6; i++) {
        const response = await request(app).get('/api/test')
        responses.push(response)
      }

      // First 5 should succeed
      responses.slice(0, 5).forEach((response) => {
        expect(response.status).toBe(200)
      })

      // 6th request should be rate limited
      expect(responses[5].status).toBe(429)
      expect(responses[5].text).toContain('Too many requests')
    })

    it('should include Retry-After header when rate limited', async () => {
      /**
       * Verify Retry-After header present when rate limited.
       * Make requests until rate limit hit.
       * Expect 429 response with Retry-After header.
       */
      // Make requests until rate limited
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/test')
      }

      // This request should be rate limited
      const response = await request(app).get('/api/test')

      expect(response.status).toBe(429)
      expect(response.headers).toHaveProperty('retry-after')

      // Retry-After should be a number (seconds)
      const retryAfter = parseInt(response.headers['retry-after'])
      expect(retryAfter).toBeGreaterThan(0)
      expect(retryAfter).toBeLessThanOrEqual(60) // Within 1 minute window
    })

    it('should track rate limits per IP address', async () => {
      /**
       * Verify rate limiting is per IP address.
       * Requests from same IP share limit.
       * Different IPs (in real scenario) would have separate limits.
       *
       * Note: In test environment, all requests appear from same IP
       * so they share the limit counter.
       */
      const responses = []

      for (let i = 0; i < 6; i++) {
        const response = await request(app).get('/api/test')
        responses.push(response)
      }

      // Verify first 5 succeed
      expect(responses.slice(0, 5).every(r => r.status === 200)).toBe(true)

      // Verify 6th is rate limited
      expect(responses[5].status).toBe(429)
    })
  })

  describe('rate limit reset', () => {
    it('should show decreasing remaining count', async () => {
      /**
       * Verify rate limit counter decrements with each request.
       * Make multiple requests and check RateLimit-Remaining header.
       * Expect count to decrease: 4, 3, 2, 1, 0.
       */
      const response1 = await request(app).get('/api/test')
      const remaining1 = parseInt(response1.headers['ratelimit-remaining'])

      const response2 = await request(app).get('/api/test')
      const remaining2 = parseInt(response2.headers['ratelimit-remaining'])

      const response3 = await request(app).get('/api/test')
      const remaining3 = parseInt(response3.headers['ratelimit-remaining'])

      expect(remaining1).toBeGreaterThan(remaining2)
      expect(remaining2).toBeGreaterThan(remaining3)
      expect(remaining1 - remaining2).toBe(1)
      expect(remaining2 - remaining3).toBe(1)
    })
  })

  describe('non-api routes', () => {
    it('should not apply rate limiting to non-API routes', async () => {
      /**
       * Verify rate limiting only applies to /api/* routes.
       * Routes outside /api/ should not be rate limited.
       *
       * Note: This test verifies the rate limiter is only
       * mounted on /api/ prefix.
       */

      // Add a non-API route for testing
      const testApp = express()
      testApp.use(express.json())

      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Rate limited',
      })

      testApp.use('/api/', limiter)
      testApp.get('/api/limited', (_req, res) => res.json({ limited: true }))
      testApp.get('/public', (_req, res) => res.json({ public: true }))

      // Make requests to public route (should not be rate limited)
      for (let i = 0; i < 5; i++) {
        const response = await request(testApp).get('/public')
        expect(response.status).toBe(200)
      }

      // API route should still enforce limit
      await request(testApp).get('/api/limited')
      await request(testApp).get('/api/limited')
      const response = await request(testApp).get('/api/limited')

      expect(response.status).toBe(429)
    })
  })
})
