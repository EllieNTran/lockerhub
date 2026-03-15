import { notificationsServiceClient } from '../connectors/notifications-service'
import logger from '../logger'
import type {
  SendPasswordResetEmailRequest,
  SendActivationEmailRequest,
  NotificationServiceResponse,
} from '../types'

/**
 * Send password reset email via notifications service
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string,
): Promise<void> => {
  const payload: SendPasswordResetEmailRequest = {
    email,
    name,
    resetLink,
  }

  try {
    await notificationsServiceClient.post<NotificationServiceResponse>(
      '/notifications/password-reset',
      payload,
    )

    logger.info('Password reset email sent successfully')
  } catch (error: unknown) {
    logger.error('Failed to send password reset email')
    throw error
  }
}

/**
 * Send account activation email via notifications service
 */
export const sendActivationEmail = async (
  email: string,
  name: string,
  activationLink: string,
): Promise<void> => {
  const payload: SendActivationEmailRequest = {
    email,
    name,
    activationLink,
  }

  try {
    await notificationsServiceClient.post<NotificationServiceResponse>(
      '/notifications/activation',
      payload,
    )

    logger.info('Activation email sent successfully')
  } catch (error: unknown) {
    logger.error('Failed to send activation email')
    throw error
  }
}
