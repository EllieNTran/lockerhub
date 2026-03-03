export class AppError extends Error {
  constructor(message, statusCode = 500, code = null, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  req.log.error({
    err,
    statusCode,
    code: err.code,
    path: req.path,
    method: req.method,
  }, 'Request error')

  const response = {
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
