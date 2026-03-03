import express from 'express'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, verifyToken, getPublicKey } from '../services/token.js'
import { findUserByEmail, findUserById } from '../services/users.js'
import logger from '../logger.js'

const router = express.Router()

/**
 * POST /auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          status: 400,
        },
      })
    }

    const user = await findUserByEmail(email)

    if (!user) {
      logger.warn({ email }, 'Failed login attempt - user not found')
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          status: 401,
        },
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      logger.warn({ email, userId: user.user_id }, 'Failed login attempt - invalid password')
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          status: 401,
        },
      })
    }

    const accessToken = generateAccessToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.user_id,
    })

    logger.info({ userId: user.user_id, email: user.email }, 'User logged in successfully')

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          message: 'Refresh token is required',
          status: 400,
        },
      })
    }

    const decoded = verifyToken(refreshToken)

    // TODO: Check if refresh token is blacklisted/revoked in database

    const user = await findUserById(decoded.userId)

    if (!user) {
      logger.warn({ userId: decoded.userId }, 'Refresh token for non-existent user')
      return res.status(401).json({
        error: {
          message: 'Invalid refresh token',
          status: 401,
        },
      })
    }

    const accessToken = generateAccessToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
    })

    logger.info({ userId: user.user_id }, 'Access token refreshed')

    res.json({
      accessToken,
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired refresh token',
          status: 401,
        },
      })
    }
    next(error)
  }
})

/**
 * POST /auth/verify
 * Verify JWT token
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        error: {
          message: 'Token is required',
          status: 400,
        },
      })
    }

    const decoded = verifyToken(token)

    res.json({
      valid: true,
      payload: decoded,
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(200).json({
        valid: false,
        error: error.message,
      })
    }
    next(error)
  }
})

/**
 * GET /auth/public-key
 * Get public key for JWT verification
 */
router.get('/public-key', (req, res) => {
  res.json({
    publicKey: getPublicKey(),
  })
})

/**
 * POST /auth/logout
 * Logout user (invalidate tokens)
 */
router.post('/logout', async (req, res, next) => {
  try {
    // TODO: Add refresh token to blacklist in database
    
    logger.info('User logged out')

    res.json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
})

export default router
