import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { requestLogger } from '../middleware/request-logger.js'
import { errorHandler } from '../middleware/error-handler.js'
import { notFoundHandler } from '../middleware/not-found.js'
import apiRoutes from './routes/api.js'
import logger from '../logger.js'
import { fromEnv } from '../constants.js'

const app = express()
const PORT = fromEnv('PORT') || 3002

app.use(helmet())
app.use(cors({
  origin: fromEnv('CORS_ORIGIN') || '*',
  credentials: true,
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(compression())

app.use(requestLogger)

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use('/api', apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(PORT, async () => {
  logger.info(`API server listening on port ${PORT}`)
})

const shutdown = (signal) => {
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
