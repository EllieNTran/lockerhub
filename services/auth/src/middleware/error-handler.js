import logger from '../logger.js'

export const errorHandler = (err, req, res, _next) => {
  logger.error(err)

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
