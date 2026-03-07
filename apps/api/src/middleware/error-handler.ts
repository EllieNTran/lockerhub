import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'

export class AppError extends Error {
  statusCode: number
  code: string | null
  isOperational: boolean
  errors?: any[]

  constructor(message: string, statusCode = 500, code: string | null = null, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler: ErrorRequestHandler = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  req.log.error({
    err,
    statusCode,
    code: err.code,
    path: req.path,
    method: req.method,
  }, 'Request error')

  const response: any = {
    status: 'error',
    statusCode,
    message,
  }

  if (err.code) {
    response.code = err.code
  }

  if (err.errors) {
    response.errors = err.errors
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}
