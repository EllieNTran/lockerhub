import pinoHttp from 'pino-http'
import logger from '../logger'
import type { Request, Response } from 'express'

export const requestLogger = pinoHttp({
  logger,
  autoLogging: true,
  customLogLevel: (_req: Request, res: Response, err?: Error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn'
    } else if (res.statusCode >= 500 || err) {
      return 'error'
    }
    return 'info'
  },
  customSuccessMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.url} ${res.statusCode}`
  },
  customErrorMessage: (req: Request, res: Response, err: Error) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  serializers: {
    req: (req: Request) => ({
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode,
    }),
  },
})
