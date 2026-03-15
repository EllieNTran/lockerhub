import pg from 'pg'
import { fromEnv } from '../constants'
import logger from '../logger'
import type { QueryResult } from '../types'

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

pool.on('error', () => {
  logger.error('Unexpected database error')
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end()
  logger.info('Database pool closed')
})

/**
 * Execute a query
 */
export const query = async <T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> => {
  try {
    const res = await pool.query(text, params)
    return res
  } catch (error: unknown) {
    logger.error('Query error')
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 */
export const getClient = async () => {
  const client = await pool.connect()
  const query = client.query.bind(client)
  const release = client.release.bind(client)

  const timeout = setTimeout(() => {
    logger.error('Client has been checked out for more than 5 seconds')
  }, 5000)

  // Override release to cleanup timeout
  client.release = () => {
    clearTimeout(timeout)
    client.query = query
    client.release = release
    return release()
  }

  return client
}

export default {
  query,
  getClient,
  pool,
}
