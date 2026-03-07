import { Router, Request, Response } from 'express'
import { authenticate, requireRole } from '../../middleware/auth'
import { proxyToService } from '../../connectors/services'

const router = Router()

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Admin service routes
 */
router.use(
  '/admin',
  authenticate,
  requireRole('admin'),
  proxyToService('admin'),
)

router.use(
  '/analytics',
  authenticate,
  requireRole('admin'),
  proxyToService('analytics'),
)

/**
 * User service routes
 */
router.use(
  '/bookings',
  authenticate,
  proxyToService('booking'),
)

export default router
