import { createProxyMiddleware } from 'http-proxy-middleware'
import logger from '../logger'
import { fromEnv } from '../constants'
import type { AuthenticatedRequest } from '../types'

const SERVICE_URLS: Record<string, string> = {
  admin: fromEnv('ADMIN_SERVICE_URL') || 'http://localhost:3004',
  analytics: fromEnv('ANALYTICS_SERVICE_URL') || 'http://localhost:3005',
  booking: fromEnv('BOOKING_SERVICE_URL') || 'http://localhost:3006',
}

/**
 * Create a proxy middleware for a specific service
 */
export const proxyToService = (serviceName: string) => {
  const serviceUrl = SERVICE_URLS[serviceName]

  if (!serviceUrl) {
    throw new Error(`Unknown service: ${serviceName}`)
  }

  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${serviceName}`]: '',
    },
    on: {
      proxyReq: (proxyReq: any, req: AuthenticatedRequest, _res: any) => {
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization)
        }

        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.userId)
          proxyReq.setHeader('X-User-Email', req.user.email)
          proxyReq.setHeader('X-User-Role', req.user.role)
          if (req.user.departmentId) {
            proxyReq.setHeader('X-User-Department', req.user.departmentId)
          }
        }

        logger.debug(
          {
            service: serviceName,
            method: req.method,
            path: req.path,
            userId: req.user?.userId,
          },
          'Proxying request to service',
        )
      },
      proxyRes: (proxyRes: any, req: any, _res: any) => {
        logger.debug(
          {
            service: serviceName,
            statusCode: proxyRes.statusCode,
            path: req.path,
          },
          'Received response from service',
        )
      },
      error: (err: any, req: any, res: any) => {
        logger.error(
          {
            error: err,
            service: serviceName,
            path: req.path,
          },
          'Proxy error',
        )

        res.status(502).json({
          status: 'error',
          statusCode: 502,
          message: `Service ${serviceName} unavailable`,
          code: 'SERVICE_UNAVAILABLE',
        })
      },
    },
  })
}
