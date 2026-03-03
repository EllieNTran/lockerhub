import pg from 'pg'
import { fromEnv } from '../constants.js'
import logger from '../logger.js'

const { Pool } = pg

const pool = new Pool({
  host: fromEnv('DB_HOST') || 'localhost',
  port: parseInt(fromEnv('DB_PORT') || '5432'),
  database: fromEnv('DB_NAME') || 'postgres',
  user: fromEnv('DB_USER') || 'postgres',
  password: fromEnv('DB_PASSWORD') || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('connect', () => {
  logger.debug('Database connection established')
})

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error')
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end()
  logger.info('Database pool closed')
})

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    logger.debug({ text, duration, rows: res.rowCount }, 'Executed query')
    return res
  } catch (error) {
    logger.error({ error, text }, 'Query error')
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
export const getClient = async () => {
  const client = await pool.connect()
  const query = client.query
  const release = client.release

  const timeout = setTimeout(() => {
    logger.error('Client has been checked out for more than 5 seconds')
  }, 5000)

  client.query = (...args) => {
    return query.apply(client, args)
  }

  client.release = () => {
    clearTimeout(timeout)
    client.query = query
    client.release = release
    return release.apply(client)
  }

  return client
}

export default {
  query,
  getClient,
  pool,
}
