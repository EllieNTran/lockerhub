import { createProxyMiddleware } from 'http-proxy-middleware'
import type { Request, Response } from 'express'
import type { ClientRequest, IncomingMessage } from 'http'
import type { Socket } from 'net'
import logger from '../logger'
import { fromEnv } from '../constants'
import type { AuthenticatedRequest } from '../types'

export const SERVICE_CONFIG = {
  booking: {
    url: fromEnv('BOOKING_SERVICE_URL') || 'http://localhost:3004',
    prefix: '/bookings',
  },
  admin: {
    url: fromEnv('ADMIN_SERVICE_URL') || 'http://localhost:3005',
    prefix: '/admin',
  },
  auth: {
    url: fromEnv('AUTH_SERVICE_URL') || 'http://localhost:3003',
    prefix: '/auth',
  },
  notifications: {
    url: fromEnv('NOTIFICATIONS_SERVICE_URL') || 'http://localhost:3006',
    prefix: '/notifications',
  },
  analytics: {
    url: fromEnv('ANALYTICS_SERVICE_URL') || 'http://localhost:3007',
    prefix: '/analytics',
  }
} as const

/**
 * Create a proxy middleware for a specific service
 */
export const proxyToService = (serviceName: keyof typeof SERVICE_CONFIG) => {
  const service = SERVICE_CONFIG[serviceName]

  if (!service) {
    throw new Error(`Unknown service: ${serviceName}`)
  }

  return createProxyMiddleware({
    target: service.url,
    changeOrigin: true,
    pathRewrite: (path) => {
      const rewrittenPath = service.prefix + path
      return rewrittenPath.length > 1 && rewrittenPath.endsWith('/')
        ? rewrittenPath.slice(0, -1)
        : rewrittenPath
    },
    on: {
      proxyReq: (proxyReq: ClientRequest, req: AuthenticatedRequest, _res: Response) => {
        if (req.body && Object.keys(req.body).length > 0 && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          const bodyData = JSON.stringify(req.body)

          if (!proxyReq.headersSent) {
            proxyReq.setHeader('Content-Type', 'application/json')
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
          }

          proxyReq.end(bodyData)
        }

        if (req.headers.authorization && !proxyReq.headersSent) {
          proxyReq.setHeader('Authorization', req.headers.authorization)
        }

        if (req.user && !proxyReq.headersSent) {
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
      proxyRes: (proxyRes: IncomingMessage, req: Request, _res: Response) => {
        logger.debug(
          {
            service: serviceName,
            statusCode: proxyRes.statusCode,
            path: req.path,
          },
          'Received response from service',
        )
      },
      error: (err: Error, req: Request, res: Response | Socket) => {
        logger.error(
          {
            error: err,
            service: serviceName,
            path: req.path,
          },
          'Proxy error',
        )

        if ('status' in res && typeof res.status === 'function') {
          res.status(502).json({
            status: 'error',
            statusCode: 502,
            message: `Service ${serviceName} unavailable`,
            code: 'SERVICE_UNAVAILABLE',
          })
        }
      },
    },
  })
}
