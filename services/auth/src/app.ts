import logger from './logger'

const run = async (): Promise<void> => {
  process.on('uncaughtExceptionMonitor', () => {
    logger.error('Uncaught exception monitored')
  })
  await import('./server/index')
}

await run()
