import { Router } from 'express'
import { requestPasswordReset, resetPassword, validateResetToken } from '../services/password-reset'
import logger from '../logger'

const router = Router()

/**
 * POST /auth/password-reset/request
 * Request password reset email (works for both forgot password and account activation)
 */
router.post('/request', async (req, res, next) => {
  try {
    const { email } = req.body
    const result = await requestPasswordReset(email)
    res.status(200).json(result)
  } catch (error) {
    logger.error({ error }, 'Error in password reset request')
    next(error)
  }
})

/**
 * POST /auth/password-reset/reset
 * Reset password using token
 */
router.post('/reset', async (req, res, next) => {
  try {
    const { token, password } = req.body
    const result = await resetPassword(token, password)
    res.status(200).json(result)
  } catch (error) {
    logger.error({ error }, 'Error resetting password')
    next(error)
  }
})

/**
 * GET /auth/password-reset/validate/:token
 * Validate a password reset token
 */
router.get('/validate/:token', async (req, res, next) => {
  try {
    const { token } = req.params
    const result = await validateResetToken(token)
    res.status(200).json(result)
  } catch (error) {
    logger.error({ error }, 'Error validating reset token')
    next(error)
  }
})

export default router
