import pino from 'pino';
import { fromEnv } from './constants';

const isDevelopment = fromEnv('NODE_ENV') !== 'production'

const logger = pino({
  level: fromEnv('LOG_LEVEL') || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export default logger
