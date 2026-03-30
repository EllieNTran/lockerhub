import { query } from '../connectors/db'
import logger from '../logger'
import type { AppError } from '../types'

/**
 * Update has_seen_tutorial for a user
 */
export const updateTutorialStatus = async (userId: string): Promise<{ message: string }> => {
  if (!userId) {
    const error = new Error('User ID is required') as AppError
    error.status = 400
    throw error
  }

  try {
    await query(
      'UPDATE lockerhub.users SET has_seen_tutorial = TRUE WHERE user_id = $1',
      [userId],
    )

    logger.info({ userId }, 'Tutorial status updated')

    return { message: 'Tutorial marked as completed' }
  } catch (error: unknown) {
    logger.error({ error, userId }, 'Error updating tutorial status')
    throw error
  }
}

/**
 * Get tutorial status for a user
 */
export const getTutorialStatus = async (userId: string): Promise<{ has_seen_tutorial: boolean }> => {
  if (!userId) {
    const error = new Error('User ID is required') as AppError
    error.status = 400
    throw error
  }

  try {
    const result = await query<{ has_seen_tutorial: boolean }>(
      'SELECT has_seen_tutorial FROM lockerhub.users WHERE user_id = $1',
      [userId],
    )

    if (!result.rows[0]) {
      const error = new Error('User not found') as AppError
      error.status = 404
      throw error
    }

    return { has_seen_tutorial: result.rows[0].has_seen_tutorial }
  } catch (error: unknown) {
    logger.error({ error, userId }, 'Error fetching tutorial status')
    throw error
  }
}
