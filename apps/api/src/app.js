import logger from './logger.js'

const run = async () => {
  process.on('uncaughtExceptionMonitor', (error, origin) => {
    logger.error(error, 'Uncaught exception monitored', { origin })
  })
  await import('./server/index.js')
}

await run()
