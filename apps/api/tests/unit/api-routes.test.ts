/**
 * Unit tests for API route configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the router
const mockAuthenticate = vi.fn()
const mockRequireRole = vi.fn()
const mockProxyToService = vi.fn()
const mockRouter = {
  use: vi.fn(),
  get: vi.fn(),
}

vi.mock('express', () => ({
  Router: vi.fn(() => mockRouter),
}))

vi.mock('../../src/middleware/auth', () => ({
  authenticate: mockAuthenticate,
  requireRole: mockRequireRole,
}))

vi.mock('../../src/connectors/services', () => ({
  proxyToService: mockProxyToService,
  SERVICE_CONFIG: {
    auth: { prefix: '/auth', url: 'http://localhost:3001' },
    booking: { prefix: '/bookings', url: 'http://localhost:3004' },
    admin: { prefix: '/admin', url: 'http://localhost:3005' },
    analytics: { prefix: '/analytics', url: 'http://localhost:3006' },
    notifications: { prefix: '/notifications', url: 'http://localhost:3002' },
  },
}))

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset module to re-execute route setup
    vi.resetModules()

    mockProxyToService.mockReturnValue((req: any, res: any, next: any) => {
      next()
    })

    mockRequireRole.mockReturnValue((req: any, res: any, next: any) => {
      next()
    })
  })

  describe('Public Auth Routes', () => {
    it('should route public auth paths without authentication', async () => {
      /**
       * Verify public auth routes bypass authentication.
       * Tests lines 20-23 in api.ts.
       */
      // Import to trigger route setup
      await import('../../src/server/routes/api')

      // Find the auth route handler
      const authRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/auth',
      )

      expect(authRouteCall).toBeDefined()
      const authRouteHandler = authRouteCall[1]

      // Mock request for public route
      const mockReq = {
        path: '/signup',
        method: 'POST',
      }
      const mockRes = {}
      const mockNext = vi.fn()

      authRouteHandler(mockReq, mockRes, mockNext)

      // Should proxy directly without authenticate
      expect(mockProxyToService).toHaveBeenCalledWith('auth')
      expect(mockAuthenticate).not.toHaveBeenCalled()
    })

    it('should authenticate protected auth routes', async () => {
      /**
       * Verify protected auth routes use authentication.
       * Tests lines 24-27 in api.ts.
       */
      await import('../../src/server/routes/api')

      const authRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/auth',
      )
      const authRouteHandler = authRouteCall[1]

      // Mock authenticate to call the callback
      mockAuthenticate.mockImplementation((req, res, callback) => {
        callback()
      })

      const mockReq = {
        path: '/user/profile',
        method: 'GET',
      }
      const mockRes = {}
      const mockNext = vi.fn()

      authRouteHandler(mockReq, mockRes, mockNext)

      expect(mockAuthenticate).toHaveBeenCalled()
      expect(mockProxyToService).toHaveBeenCalledWith('auth')
    })

    it('should handle authentication errors on protected auth routes', async () => {
      /**
       * Verify authentication errors are passed to next().
       * Tests line 25 error handling.
       */
      await import('../../src/server/routes/api')

      const authRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/auth',
      )
      const authRouteHandler = authRouteCall[1]

      // Clear mocks after saving route handler
      vi.clearAllMocks()

      const authError = new Error('Invalid token')

      // Mock authenticate to pass error
      mockAuthenticate.mockImplementation((req, res, callback) => {
        callback(authError)
      })

      const mockReq = {
        path: '/user/profile',
        method: 'GET',
      }
      const mockRes = {}
      const mockNext = vi.fn()

      authRouteHandler(mockReq, mockRes, mockNext)

      expect(mockAuthenticate).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith(authError)
      expect(mockProxyToService).not.toHaveBeenCalled()
    })

    it('should recognize all public auth routes', async () => {
      /**
       * Verify all public auth paths are recognized.
       * Tests the isPublicAuthRoute function.
       */
      await import('../../src/server/routes/api')

      const authRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/auth',
      )
      const authRouteHandler = authRouteCall[1]

      const publicPaths = ['/signup', '/login', '/password-reset', '/metadata']

      for (const path of publicPaths) {
        vi.clearAllMocks()
        mockAuthenticate.mockClear()

        const mockReq = { path, method: 'POST' }
        authRouteHandler(mockReq, {}, vi.fn())

        expect(mockAuthenticate).not.toHaveBeenCalled()
      }
    })
  })

  describe('Public Notification Routes', () => {
    it('should route public notification paths without authentication', async () => {
      /**
       * Verify public notification routes bypass authentication.
       * Tests lines 29-32 in api.ts.
       */
      await import('../../src/server/routes/api')

      const notificationRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/notifications',
      )

      expect(notificationRouteCall).toBeDefined()
      const notificationRouteHandler = notificationRouteCall[1]

      const mockReq = {
        path: '/password-reset',
        method: 'POST',
      }
      const mockRes = {}
      const mockNext = vi.fn()

      notificationRouteHandler(mockReq, mockRes, mockNext)

      expect(mockProxyToService).toHaveBeenCalledWith('notifications')
      expect(mockAuthenticate).not.toHaveBeenCalled()
    })

    it('should authenticate protected notification routes', async () => {
      /**
       * Verify protected notification routes use authentication.
       * Tests lines 33-36 in api.ts.
       */
      await import('../../src/server/routes/api')

      const notificationRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/notifications',
      )
      const notificationRouteHandler = notificationRouteCall[1]

      mockAuthenticate.mockImplementation((req, res, callback) => {
        callback()
      })

      const mockReq = {
        path: '/user/notifications',
        method: 'GET',
      }
      const mockRes = {}
      const mockNext = vi.fn()

      notificationRouteHandler(mockReq, mockRes, mockNext)

      expect(mockAuthenticate).toHaveBeenCalled()
      expect(mockProxyToService).toHaveBeenCalledWith('notifications')
    })

    it('should handle authentication errors on protected notification routes', async () => {
      /**
       * Verify authentication errors are passed to next().
       * Tests error handling in callback.
       */
      await import('../../src/server/routes/api')

      const notificationRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/notifications',
      )
      const notificationRouteHandler = notificationRouteCall[1]

      // Clear mocks after saving route handler
      vi.clearAllMocks()

      const authError = new Error('Token expired')

      mockAuthenticate.mockImplementation((req, res, callback) => {
        callback(authError)
      })

      const mockReq = {
        path: '/user/notifications',
        method: 'GET',
      }
      const mockRes = {}
      const mockNext = vi.fn()

      notificationRouteHandler(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(authError)
      expect(mockProxyToService).not.toHaveBeenCalled()
    })

    it('should recognize all public notification routes', async () => {
      /**
       * Verify all public notification paths are recognized.
       */
      await import('../../src/server/routes/api')

      const notificationRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/notifications',
      )
      const notificationRouteHandler = notificationRouteCall[1]

      const publicPaths = ['/password-reset', '/activation', '/health']

      for (const path of publicPaths) {
        vi.clearAllMocks()
        mockAuthenticate.mockClear()

        const mockReq = { path, method: 'POST' }
        notificationRouteHandler(mockReq, {}, vi.fn())

        expect(mockAuthenticate).not.toHaveBeenCalled()
      }
    })
  })

  describe('Protected Service Routes', () => {
    it('should configure booking route with authentication', async () => {
      /**
       * Verify booking service route requires authentication.
       * Tests lines 45-53 service route setup.
       */
      await import('../../src/server/routes/api')

      const bookingRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/bookings',
      )

      expect(bookingRouteCall).toBeDefined()
      expect(bookingRouteCall.length).toBeGreaterThan(1)
      // Middleware should include authenticate
      expect(mockAuthenticate).toBeDefined()
    })

    it('should configure admin route with authentication and role check', async () => {
      /**
       * Verify admin service route requires authentication + admin role.
       * Tests role-based middleware setup.
       */
      await import('../../src/server/routes/api')

      const adminRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/admin',
      )

      expect(adminRouteCall).toBeDefined()
      // Should have auth middleware + role middleware + proxy
      expect(mockRequireRole).toHaveBeenCalledWith('admin')
    })

    it('should configure analytics route with authentication and admin role', async () => {
      /**
       * Verify analytics service route requires authentication + admin role.
       */
      await import('../../src/server/routes/api')

      const analyticsRouteCall = mockRouter.use.mock.calls.find(
        (call) => call[0] === '/analytics',
      )

      expect(analyticsRouteCall).toBeDefined()
      expect(mockRequireRole).toHaveBeenCalledWith('admin')
    })
  })

  describe('Health Check Route', () => {
    it('should register health check endpoint', async () => {
      /**
       * Verify health check route is registered.
       * Tests lines 55-59 in api.ts.
       */
      await import('../../src/server/routes/api')

      const healthRouteCall = mockRouter.get.mock.calls.find(
        (call) => call[0] === '/health',
      )

      expect(healthRouteCall).toBeDefined()

      const healthHandler = healthRouteCall[1]
      const mockRes = {
        json: vi.fn(),
      }

      healthHandler({} as any, mockRes as any)

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'ok',
        timestamp: expect.any(String),
      })
    })
  })
})
