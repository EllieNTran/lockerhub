import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import logger from '../logger'
import type { AppError } from '../types'

export const errorHandler: ErrorRequestHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error occurred')

  const statusCode = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  })
}
