/**
 * Unit tests for service proxy connectors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { proxyToService, SERVICE_CONFIG } from '../../src/connectors/services'
import type { AuthenticatedRequest } from '../../src/types'
import type { Response } from 'express'

// Mock http-proxy-middleware
const mockProxyMiddleware = vi.fn()
vi.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: vi.fn((options) => {
    mockProxyMiddleware(options)
    return (req: any, res: any, next: any) => {
      // Store options for testing
      ;(req as any).__proxyOptions = options
      next()
    }
  }),
}))

// Mock logger
vi.mock('../../src/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Service Proxy Connectors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SERVICE_CONFIG', () => {
    it('should define all service configurations', () => {
      /**
       * Verify all services are configured with URL and prefix.
       */
      expect(SERVICE_CONFIG).toHaveProperty('booking')
      expect(SERVICE_CONFIG).toHaveProperty('admin')
      expect(SERVICE_CONFIG).toHaveProperty('auth')
      expect(SERVICE_CONFIG).toHaveProperty('notifications')
      expect(SERVICE_CONFIG).toHaveProperty('analytics')

      expect(SERVICE_CONFIG.booking.prefix).toBe('/bookings')
      expect(SERVICE_CONFIG.admin.prefix).toBe('/admin')
      expect(SERVICE_CONFIG.auth.prefix).toBe('/auth')
      expect(SERVICE_CONFIG.notifications.prefix).toBe('/notifications')
      expect(SERVICE_CONFIG.analytics.prefix).toBe('/analytics')
    })
  })

  describe('proxyToService', () => {
    it('should throw error for unknown service', () => {
      /**
       * Verify error is thrown for invalid service name.
       * Tests line 39 in services.ts.
       */
      expect(() => {
        proxyToService('unknown' as any)
      }).toThrow('Unknown service: unknown')
    })

    it('should create proxy middleware for valid service', () => {
      /**
       * Verify proxy middleware is created with correct config.
       */
      const proxy = proxyToService('booking')

      expect(proxy).toBeDefined()
      expect(typeof proxy).toBe('function')
      expect(mockProxyMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.stringContaining('3004'),
          changeOrigin: true,
        }),
      )
    })

    describe('pathRewrite', () => {
      it('should rewrite path correctly', () => {
        /**
         * Verify path rewriting adds service prefix.
         * Tests lines 46-50 in services.ts.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const pathRewrite = options.pathRewrite

        expect(pathRewrite('/status')).toBe('/bookings/status')
        expect(pathRewrite('/users/123')).toBe('/bookings/users/123')
      })

      it('should remove trailing slash from rewritten path', () => {
        /**
         * Verify trailing slashes are removed.
         * Tests the slice logic at lines 48-49.
         */
        proxyToService('auth')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const pathRewrite = options.pathRewrite

        expect(pathRewrite('/login/')).toBe('/auth/login')
        expect(pathRewrite('/signup/')).toBe('/auth/signup')
      })

      it('should preserve path without trailing slash', () => {
        /**
         * Verify paths without trailing slash are preserved.
         */
        proxyToService('admin')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const pathRewrite = options.pathRewrite

        expect(pathRewrite('/users')).toBe('/admin/users')
        expect(pathRewrite('/dashboard')).toBe('/admin/dashboard')
      })
    })

    describe('proxyReq event handler', () => {
      it('should forward request body for POST requests', () => {
        /**
         * Verify request body is forwarded for POST requests.
         * Tests lines 54-63 in services.ts.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
          end: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'POST',
          body: { name: 'Test', email: 'test@example.com' },
          headers: {},
          path: '/bookings',
        }

        const mockRes: Partial<Response> = {}

        proxyReqHandler(mockProxyReq as any, mockReq as any, mockRes as any)

        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Content-Length', expect.any(Number))
        expect(mockProxyReq.end).toHaveBeenCalledWith(
          JSON.stringify(mockReq.body),
        )
      })

      it('should forward request body for PUT requests', () => {
        /**
         * Verify request body forwarding works for PUT.
         * Tests line 54 condition.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
          end: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'PUT',
          body: { status: 'active' },
          headers: {},
          path: '/bookings/123',
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(mockProxyReq.end).toHaveBeenCalled()
      })

      it('should forward request body for PATCH requests', () => {
        /**
         * Verify request body forwarding works for PATCH.
         */
        proxyToService('admin')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
          end: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'PATCH',
          body: { name: 'Updated' },
          headers: {},
          path: '/admin/users/1',
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(mockProxyReq.end).toHaveBeenCalled()
      })

      it('should not forward body for GET requests', () => {
        /**
         * Verify GET requests don't trigger body forwarding.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
          end: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'GET',
          body: {},
          headers: {},
          path: '/bookings',
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(mockProxyReq.end).not.toHaveBeenCalled()
      })

      it('should skip body forwarding if headers already sent', () => {
        /**
         * Verify body is not forwarded if headers already sent.
         * Tests the !proxyReq.headersSent check at line 57.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: true, // Headers already sent
          setHeader: vi.fn(),
          end: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'POST',
          body: { data: 'test' },
          headers: {},
          path: '/bookings',
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(mockProxyReq.setHeader).not.toHaveBeenCalled()
      })

      it('should forward Authorization header', () => {
        /**
         * Verify Authorization header is forwarded.
         * Tests lines 65-67 in services.ts.
         */
        proxyToService('auth')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'GET',
          headers: {
            authorization: 'Bearer token123',
          },
          path: '/auth/user',
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer token123')
      })

      it('should forward user information headers', () => {
        /**
         * Verify user info is forwarded as headers.
         * Tests lines 69-77 in services.ts.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'GET',
          headers: {},
          path: '/bookings',
          user: {
            userId: 'user-123',
            email: 'user@example.com',
            role: 'admin',
            departmentId: 'dept-456',
            scope: 'user:admin',
          },
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Id', 'user-123')
        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Email', 'user@example.com')
        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Role', 'admin')
        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Department', 'dept-456')
      })

      it('should skip department header if not present', () => {
        /**
         * Verify department header is optional.
         * Tests the conditional at line 74.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'GET',
          headers: {},
          path: '/bookings',
          user: {
            userId: 'user-123',
            email: 'user@example.com',
            role: 'user',
            scope: 'user:user',
            // No departmentId
          },
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Id', 'user-123')
        expect(mockProxyReq.setHeader).not.toHaveBeenCalledWith('X-User-Department', expect.anything())
      })

      it('should log proxy request debug info', async () => {
        /**
         * Verify logging of proxy requests.
         * Tests lines 79-86 in services.ts.
         */
        const logger = await import('../../src/logger')

        proxyToService('analytics')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyReqHandler = options.on.proxyReq

        const mockProxyReq = {
          headersSent: false,
          setHeader: vi.fn(),
        }

        const mockReq: Partial<AuthenticatedRequest> = {
          method: 'GET',
          path: '/analytics/stats',
          headers: {},
          user: {
            userId: 'admin-1',
            email: 'admin@example.com',
            role: 'admin',
            scope: 'user:admin',
          },
        }

        proxyReqHandler(mockProxyReq as any, mockReq as any, {} as any)

        expect(logger.default.debug).toHaveBeenCalledWith(
          {
            service: 'analytics',
            method: 'GET',
            path: '/analytics/stats',
            userId: 'admin-1',
          },
          'Proxying request to service',
        )
      })
    })

    describe('proxyRes event handler', () => {
      it('should log successful proxy response', async () => {
        /**
         * Verify logging of proxy responses.
         * Tests lines 88-96 in services.ts.
         */
        const logger = await import('../../src/logger')

        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const proxyResHandler = options.on.proxyRes

        const mockProxyRes = {
          statusCode: 200,
        }

        const mockReq = {
          path: '/bookings/123',
        }

        const mockRes = {}

        proxyResHandler(mockProxyRes as any, mockReq as any, mockRes as any)

        expect(logger.default.debug).toHaveBeenCalledWith(
          {
            service: 'booking',
            statusCode: 200,
            path: '/bookings/123',
          },
          'Received response from service',
        )
      })
    })

    describe('error event handler', () => {
      it('should log and handle proxy errors', async () => {
        /**
         * Verify error logging and response handling.
         * Tests lines 98-114 in services.ts.
         */
        const logger = await import('../../src/logger')

        proxyToService('admin')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const errorHandler = options.on.error

        const mockError = new Error('Service unavailable')

        const mockReq = {
          path: '/admin/users',
        }

        const mockRes = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        }

        errorHandler(mockError, mockReq as any, mockRes as any)

        expect(logger.default.error).toHaveBeenCalledWith(
          {
            error: mockError,
            service: 'admin',
            path: '/admin/users',
          },
          'Proxy error',
        )

        expect(mockRes.status).toHaveBeenCalledWith(502)
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'error',
          statusCode: 502,
          message: 'Service admin unavailable',
          code: 'SERVICE_UNAVAILABLE',
        })
      })

      it('should skip response if res is not a Response object', () => {
        /**
         * Verify error handler checks if res has status method.
         * Tests line 107 conditional.
         */
        proxyToService('booking')

        const options = mockProxyMiddleware.mock.calls[0][0]
        const errorHandler = options.on.error

        const mockError = new Error('Connection error')
        const mockReq = { path: '/bookings' }
        const mockSocket = {} // Socket doesn't have status method

        // Should not throw
        expect(() => {
          errorHandler(mockError, mockReq as any, mockSocket as any)
        }).not.toThrow()
      })
    })
  })
})
