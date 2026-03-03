import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, verifyToken } from './token.js'
import { findUserByEmail, findUserById } from './users.js'
import logger from '../logger.js'

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Access token, refresh token, and user info
 */
export const login = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required')
    error.status = 400
    throw error
  }

  const user = await findUserByEmail(email)

  if (!user) {
    logger.warn({ email }, 'Failed login attempt - user not found')
    const error = new Error('Invalid email or password')
    error.status = 401
    throw error
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) {
    logger.warn({ email, userId: user.user_id }, 'Failed login attempt - invalid password')
    const error = new Error('Invalid email or password')
    error.status = 401
    throw error
  }

  const accessToken = generateAccessToken({
    userId: user.user_id,
    email: user.email,
    role: user.role,
    departmentId: user.department_id,
  })

  const refreshToken = generateRefreshToken({
    userId: user.user_id,
  })

  logger.info({ userId: user.user_id, email: user.email }, 'User logged in successfully')

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    },
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */
export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required')
    error.status = 400
    throw error
  }

  let decoded
  try {
    decoded = verifyToken(refreshToken)
  } catch (error) {
    logger.warn({ error: error.message }, 'Invalid refresh token')
    const err = new Error('Invalid or expired refresh token')
    err.status = 401
    throw err
  }

  // TODO: Check if refresh token is blacklisted/revoked in database

  const user = await findUserById(decoded.userId)

  if (!user) {
    logger.warn({ userId: decoded.userId }, 'Refresh token for non-existent user')
    const error = new Error('Invalid refresh token')
    error.status = 401
    throw error
  }

  const accessToken = generateAccessToken({
    userId: user.user_id,
    email: user.email,
    role: user.role,
    departmentId: user.department_id,
  })

  logger.info({ userId: user.user_id }, 'Access token refreshed')

  return { accessToken }
}

/**
 * Logout user
 * @param {string} _refreshToken - Refresh token to invalidate
 * @returns {Promise<Object>} Success message
 */
export const logout = async (_refreshToken) => {
  // TODO: Add refresh token to blacklist in database

  logger.info('User logged out')

  return { message: 'Logged out successfully' }
}
