/**
 * Unit tests for email services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sendResetPasswordEmail, sendActivationEmail } from '../../src/services/auth'
import * as sendEmail from '../../src/utils/send-email'
import { validPasswordResetEmail, validActivationEmail } from '../fixtures'

vi.mock('../../src/utils/send-email')

describe('Email Services', () => {
  describe('sendResetPasswordEmail', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send password reset email', async () => {
      /**
       * Verify password reset email is sent with correct data.
       * Mock email utility to succeed.
       */
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await sendResetPasswordEmail(
        validPasswordResetEmail.email,
        validPasswordResetEmail.name,
        validPasswordResetEmail.resetLink,
      )

      expect(sendEmail.default).toHaveBeenCalledWith(
        validPasswordResetEmail.email,
        expect.objectContaining({
          NAME: validPasswordResetEmail.name,
          RESET_LINK: validPasswordResetEmail.resetLink,
          EXPIRY_MINUTES: 60,
        }),
        'password-reset',
        'Password Reset',
      )
    })

    it('should handle email sending errors', async () => {
      /**
       * Verify error handling when email fails to send.
       * Mock email utility to throw error.
       */
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('Email service unavailable'))

      await expect(
        sendResetPasswordEmail(
          validPasswordResetEmail.email,
          validPasswordResetEmail.name,
          validPasswordResetEmail.resetLink,
        ),
      ).rejects.toThrow('Email service unavailable')
    })
  })

  describe('sendActivationEmail', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send activation email', async () => {
      /**
       * Verify activation email is sent with correct data.
       * Mock email utility to succeed.
       */
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await sendActivationEmail(
        validActivationEmail.email,
        validActivationEmail.name,
        validActivationEmail.activationLink,
      )

      expect(sendEmail.default).toHaveBeenCalledWith(
        validActivationEmail.email,
        expect.objectContaining({
          NAME: validActivationEmail.name,
          ACTIVATION_LINK: validActivationEmail.activationLink,
          EXPIRY_MINUTES: 60,
        }),
        'account-activation',
        'Account Activation',
      )
    })

    it('should handle email sending errors', async () => {
      /**
       * Verify error handling when email fails to send.
       * Mock email utility to throw error.
       */
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('SMTP connection failed'))

      await expect(
        sendActivationEmail(
          validActivationEmail.email,
          validActivationEmail.name,
          validActivationEmail.activationLink,
        ),
      ).rejects.toThrow('SMTP connection failed')
    })
  })
})
