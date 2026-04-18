import express, { Request, Response } from 'express'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { requestLogger } from '../middleware/request-logger'
import { errorHandler } from '../middleware/error-handler'
import { notFoundHandler } from '../middleware/not-found'
import notificationRoutes from '../routes/notifications'
import logger from '../logger'
import { fromEnv } from '../constants'

const app = express()
const PORT = fromEnv('PORT') || 80

app.use(helmet())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(compression())

app.use(requestLogger)

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use('/notifications', notificationRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`Notifications service listening on port ${PORT}`)
    })

    return server
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to start server')
    process.exit(1)
  }
}

const server = await startServer()

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`)
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export default app
