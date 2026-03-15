import express, { Request, Response } from 'express'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { requestLogger } from '../middleware/request-logger'
import { errorHandler } from '../middleware/error-handler'
import { notFoundHandler } from '../middleware/not-found'
import authRoutes from '../routes/auth'
import passwordResetRoutes from '../routes/password-reset'
import metadataRoutes from '../routes/metadata'
import logger from '../logger'
import { fromEnv } from '../constants'

const app = express()
const PORT = fromEnv('PORT') || 80

app.use(helmet())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(compression())

app.use(requestLogger)

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'auth',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use('/auth', authRoutes)
app.use('/auth/password-reset', passwordResetRoutes)
app.use('/auth/metadata', metadataRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(PORT, () => {
  logger.info('Auth server listening on port')
})

const shutdown = () => {
  logger.info('Signal received, shutting down gracefully')
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

process.on('SIGTERM', () => shutdown())
process.on('SIGINT', () => shutdown())

export default app
