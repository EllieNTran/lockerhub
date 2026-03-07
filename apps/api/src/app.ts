import logger from './logger'

const run = async (): Promise<void> => {
  process.on('uncaughtExceptionMonitor', (error, origin) => {
    logger.error(error, 'Uncaught exception monitored', { origin })
  })
  await import('./server/index')
}

await run()
