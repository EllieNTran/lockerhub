import { createProxyMiddleware } from 'http-proxy-middleware'
import logger from '../logger.js'
import { fromEnv } from '../constants.js'

const SERVICE_URLS = {
  admin: fromEnv('ADMIN_SERVICE_URL') || 'http://localhost:3004',
  analytics: fromEnv('ANALYTICS_SERVICE_URL') || 'http://localhost:3005',
  booking: fromEnv('BOOKING_SERVICE_URL') || 'http://localhost:3006',
}

/**
 * Create a proxy middleware for a specific service
 *
 * @param {string} serviceName - Name of the service to proxy to
 * @returns {Function} Express middleware
 */
export const proxyToService = (serviceName) => {
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
    onProxyReq: (proxyReq, req, _res) => {
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
    onProxyRes: (proxyRes, req, _res) => {
      logger.debug(
        {
          service: serviceName,
          statusCode: proxyRes.statusCode,
          path: req.path,
        },
        'Received response from service',
      )
    },
    onError: (err, req, res) => {
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
  })
}
