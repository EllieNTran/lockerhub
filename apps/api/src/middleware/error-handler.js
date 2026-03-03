export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  req.log.error({
    err,
    statusCode,
    path: req.path,
    method: req.method,
  }, 'Request error')

  const response = {
    status: 'error',
    statusCode,
    message,
  }

  if (err.errors) {
    response.errors = err.errors
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}
