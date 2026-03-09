import { Router, Request, Response } from 'express'
import { authenticate, requireRole } from '../../middleware/auth'
import { proxyToService, SERVICE_CONFIG } from '../../connectors/services'

const router = Router()

const SERVICE_ROUTES = [
  { service: 'booking' as const, auth: true },
  { service: 'admin' as const, auth: true, role: 'admin' as const },
  { service: 'auth' as const, auth: true },
]

SERVICE_ROUTES.forEach((route) => {
  const middleware: any[] = []
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
