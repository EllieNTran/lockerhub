import crypto from 'crypto'
import { query } from '../connectors/db'
import logger from '../logger'

/**
 * Hash a token for secure storage in the blacklist
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Add a refresh token to the blacklist
 */
export const blacklistToken = async (token: string, userId: string, expiresAt: Date): Promise<void> => {
  try {
    const tokenHash = hashToken(token)

    await query(
      `INSERT INTO lockerhub.refresh_token_blacklist (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token_hash) DO NOTHING`,
      [tokenHash, userId, expiresAt],
    )

    logger.info({ userId }, 'Refresh token added to blacklist')
  } catch (error: unknown) {
    logger.error({ error, userId }, 'Error blacklisting refresh token')
    throw error
  }
}

/**
 * Check if a refresh token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const tokenHash = hashToken(token)

    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM lockerhub.refresh_token_blacklist 
        WHERE token_hash = $1 AND expires_at > NOW()
      ) as exists`,
      [tokenHash],
    )

    return result.rows[0]?.exists || false
  } catch (error: unknown) {
    logger.error({ error }, 'Error checking if token is blacklisted')
    throw error
  }
}

/**
 * Clean up expired tokens from the blacklist
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const result = await query<{ count: number }>(
      `WITH deleted AS (
        DELETE FROM lockerhub.refresh_token_blacklist 
        WHERE expires_at <= NOW()
        RETURNING *
      )
      SELECT COUNT(*) as count FROM deleted`,
    )

    const count = parseInt(result.rows[0]?.count?.toString() || '0')
    logger.info({ count }, 'Cleaned up expired blacklisted tokens')
    return count
  } catch (error: unknown) {
    logger.error({ error }, 'Error cleaning up expired tokens')
    throw error
  }
}
