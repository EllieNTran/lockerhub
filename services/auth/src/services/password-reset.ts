import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import pool from '../connectors/db'
import { findUserByEmail } from './users'
import { sendPasswordResetEmail, sendActivationEmail } from './notifications'
import logger from '../logger'
import type { AppError } from '../types'
import type {
  PasswordResetResponse,
  ResetPasswordResponse,
  UserWithResetToken,
  ValidateTokenResult,
} from '../types'

/**
 * Request password reset - generates reset token and sends email
 * Works for both "forgot password" and "activate account" scenarios
 */
export const requestPasswordReset = async (email: string): Promise<PasswordResetResponse> => {
  if (!email) {
    const error = new Error('Email is required') as AppError
    error.status = 400
    throw error
  }

  const user = await findUserByEmail(email)

  if (!user) {
    logger.warn({ email }, 'Password reset requested for non-existent user')

    return {
      message: 'If an account exists with this email, a password reset link will be sent.',
    }
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await pool.query(
    `UPDATE lockerhub.users 
     SET password_reset_token = $1, 
         password_reset_expires = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $3`,
    [resetTokenHash, expiresAt, user.user_id],
  )

  const resetLink = `${process.env.WEBAPP_URL}/reset-password?token=${resetToken}`
  if (user.is_pre_registered) {
    await sendActivationEmail(user.email, user.first_name || 'User', resetLink)
  } else {
    await sendPasswordResetEmail(user.email, user.first_name || 'User', resetLink)
  }

  logger.info({ userId: user.user_id, email: user.email },
    user.is_pre_registered ? 'Account activation email requested' : 'Password reset requested')

  return {
    message: user.is_pre_registered
      ? 'Account activation link has been sent to your email.'
      : 'Password reset link has been sent to your email.',
    isPreRegistered: user.is_pre_registered || false,
  }
}

/**
 * Reset password using token
 */
export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<ResetPasswordResponse> => {
  if (!token || !newPassword) {
    const error = new Error('Token and new password are required') as AppError
    error.status = 400
    throw error
  }

  if (newPassword.length < 8) {
    const error = new Error('Password must be at least 8 characters long') as AppError
    error.status = 400
    throw error
  }

  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const result = await pool.query<UserWithResetToken>(
    `SELECT 
       user_id, 
       email, 
       is_pre_registered,
       password_reset_token, 
       password_reset_expires 
     FROM lockerhub.users 
     WHERE password_reset_token = $1 
       AND password_reset_expires > NOW()`,
    [resetTokenHash],
  )

  if (result.rows.length === 0) {
    logger.warn({ token: resetTokenHash.substring(0, 10) }, 'Invalid or expired reset token')
    const error = new Error('Invalid or expired password reset token') as AppError
    error.status = 400
    throw error
  }

  const user = result.rows[0]
  const passwordHash = await bcrypt.hash(newPassword, 10)

  await pool.query(
    `UPDATE lockerhub.users 
     SET password_hash = $1, 
         password_reset_token = NULL, 
         password_reset_expires = NULL,
         account_activated = TRUE,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2`,
    [passwordHash, user.user_id],
  )

  logger.info({ userId: user.user_id, email: user.email },
    user.is_pre_registered ? 'Account activated successfully' : 'Password reset successfully')

  return {
    message: user.is_pre_registered
      ? 'Account activated successfully. You can now login.'
      : 'Password reset successfully. You can now login with your new password.',
  }
}

/**
 * Validate a password reset token without using it
 */
export const validateResetToken = async (token: string): Promise<{ valid: boolean; email?: string }> => {
  if (!token) {
    return { valid: false }
  }

  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const result = await pool.query<ValidateTokenResult>(
    `SELECT email 
     FROM lockerhub.users 
     WHERE password_reset_token = $1 
       AND password_reset_expires > NOW()`,
    [resetTokenHash],
  )

  if (result.rows.length === 0) {
    return { valid: false }
  }

  return {
    valid: true,
    email: result.rows[0].email,
  }
}
