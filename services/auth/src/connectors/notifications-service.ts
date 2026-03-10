import { fromEnv } from '../constants'
import logger from '../logger'

const NOTIFICATIONS_SERVICE_URL = fromEnv('NOTIFICATIONS_SERVICE_URL')

if (!NOTIFICATIONS_SERVICE_URL) {
  logger.error('NOTIFICATIONS_SERVICE_URL environment variable is not set')
  throw new Error('NOTIFICATIONS_SERVICE_URL environment variable is required')
}

export const notificationsServiceClient = {
  async post<T = unknown>(endpoint: string, data: unknown): Promise<T> {
    const url = `${NOTIFICATIONS_SERVICE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(errorData)}`,
        )
      }

      return await response.json() as T
    } catch (error: unknown) {
      logger.error({ error, url }, 'Notifications service request failed')
      throw error
    }
  },
}
