import { Router, Request, Response, RequestHandler } from 'express'
import { authenticate, requireRole } from '../../middleware/auth'
import { proxyToService, SERVICE_CONFIG } from '../../connectors/services'

const router = Router()

// Public auth routes (no authentication required)
const publicAuthRoutes = ['/signup', '/login', '/password-reset', '/metadata']
const isPublicAuthRoute = (path: string) => {
  return publicAuthRoutes.some((route) => path.includes(route))
}

// Public notification routes (no authentication required)
const publicNotificationRoutes = ['/password-reset', '/activation', '/health']
const isPublicNotificationRoute = (path: string) => {
  return publicNotificationRoutes.some((route) => path.includes(route))
}

// Auth routes with conditional authentication
router.use(SERVICE_CONFIG.auth.prefix, (req, res, next) => {
  if (isPublicAuthRoute(req.path)) {
    return proxyToService('auth')(req, res, next)
  }
  return authenticate(req, res, (err) => {
    if (err) return next(err)
    proxyToService('auth')(req, res, next)
  })
})

router.use(SERVICE_CONFIG.notifications.prefix, (req, res, next) => {
  if (isPublicNotificationRoute(req.path)) {
    return proxyToService('notifications')(req, res, next)
  }
  return authenticate(req, res, (err) => {
    if (err) return next(err)
    proxyToService('notifications')(req, res, next)
  })
})

// Other service routes with authentication
const SERVICE_ROUTES = [
  { service: 'booking' as const, auth: true },
  { service: 'admin' as const, auth: true, role: 'admin' as const },
]

SERVICE_ROUTES.forEach((route) => {
  const middleware: RequestHandler[] = []
  if (route.auth) middleware.push(authenticate)
  if ('role' in route && route.role) middleware.push(requireRole(route.role))
  middleware.push(proxyToService(route.service))

  router.use(SERVICE_CONFIG[route.service].prefix, ...middleware)
})

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

export default router
