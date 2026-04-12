import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, verifyToken } from './token'
import { findUserByEmail, findUserById, createUser } from './users'
import { blacklistToken, isTokenBlacklisted } from './token-blacklist'
import logger from '../logger'
import type { AppError, SignupResponse, LoginResponse, RefreshResponse, LogoutResponse } from '../types'

/** * Register a new user
 */
export const signup = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  staffNumber?: string,
  departmentId?: string,
  office?: string,
): Promise<SignupResponse> => {
  if (!firstName || !lastName || !email || !password) {
    const error = new Error('First name, last name, email, and password are required') as AppError
    error.status = 400
    throw error
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    // Check if this is a pre-registered user who hasn't activated their account
    if (existingUser.is_pre_registered && !existingUser.account_activated) {
      logger.warn({ email }, 'Signup attempt for pre-registered user')
      const error = new Error(
        'An account already exists with this email. Please activate your account to set your password.',
      ) as AppError
      error.status = 409
      error.code = 'ACCOUNT_NOT_ACTIVATED'
      throw error
    }

    logger.warn({ email }, 'Signup attempt with existing email')
    const error = new Error('User with this email already exists') as AppError
    error.status = 409
    throw error
  }

  // For new signups (not pre-registered), require staff number and department
  if (!staffNumber || !departmentId || !office) {
    const error = new Error('Staff number, department, and office are required for new signups') as AppError
    error.status = 400
    throw error
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await createUser({
    firstName,
    lastName,
    email,
    passwordHash,
    role: 'user',
    staffNumber: staffNumber || null,
    departmentId: departmentId || null,
    office: office || null,
  })

  const accessToken = generateAccessToken({
    userId: user.user_id,
    email: user.email,
    role: user.role,
    departmentId: user.department_id,
  })

  const refreshToken = generateRefreshToken({
    userId: user.user_id,
  })

  logger.info({ userId: user.user_id, email: user.email }, 'User signed up successfully')

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      has_seen_tutorial: user.has_seen_tutorial,
    },
  }
}

/** * Authenticate user with email and password
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  if (!email || !password) {
    const error = new Error('Email and password are required') as AppError
    error.status = 400
    throw error
  }

  const user = await findUserByEmail(email)

  if (!user) {
    logger.warn({ email }, 'Failed login attempt - user not found')
    const error = new Error('Invalid email or password') as AppError
    error.status = 401
    throw error
  }

  // Check if account is activated
  if (user.is_pre_registered && !user.account_activated) {
    logger.warn({ email, userId: user.user_id }, 'Login attempt for unactivated pre-registered account')
    const error = new Error(
      'Account not activated. Please activate your account to set your password.',
    ) as AppError
    error.status = 403
    error.code = 'ACCOUNT_NOT_ACTIVATED'
    throw error
  }

  // Check if password is set (shouldn't happen but extra safety)
  if (!user.password_hash) {
    logger.warn({ email, userId: user.user_id }, 'Login attempt for account without password')
    const error = new Error('Account not activated. Please activate your account.') as AppError
    error.status = 403
    error.code = 'ACCOUNT_NOT_ACTIVATED'
    throw error
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) {
    logger.warn({ email, userId: user.user_id }, 'Failed login attempt - invalid password')
    const error = new Error('Invalid email or password') as AppError
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
      has_seen_tutorial: user.has_seen_tutorial,
    },
  }
}

/**
 * Refresh access token using refresh token
 */
export const refresh = async (refreshToken: string): Promise<RefreshResponse> => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required') as AppError
    error.status = 400
    throw error
  }

  let decoded
  try {
    decoded = verifyToken(refreshToken)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.warn({ error: message }, 'Invalid refresh token')
    const err = new Error('Invalid or expired refresh token') as AppError
    err.status = 401
    throw err
  }

  const isBlacklisted = await isTokenBlacklisted(refreshToken)
  if (isBlacklisted) {
    logger.warn({ userId: decoded.userId }, 'Attempted to use blacklisted refresh token')
    const error = new Error('Refresh token has been revoked') as AppError
    error.status = 401
    throw error
  }

  const user = await findUserById(decoded.userId)

  if (!user) {
    logger.warn({ userId: decoded.userId }, 'Refresh token for non-existent user')
    const error = new Error('Invalid refresh token') as AppError
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
 */
export const logout = async (refreshToken: string): Promise<LogoutResponse> => {
  // Handle empty token gracefully - client-side cleanup is sufficient
  if (!refreshToken) {
    logger.info('Logout called without refresh token')
    return { message: 'Logged out successfully' }
  }

  try {
    const decoded = verifyToken(refreshToken)
    const expiresAt = new Date(decoded.exp * 1000)

    await blacklistToken(refreshToken, decoded.userId, expiresAt)

    logger.info({ userId: decoded.userId }, 'User logged out successfully')

    return { message: 'Logged out successfully' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.warn({ error: message }, 'Logout attempted with invalid token')

    return { message: 'Logged out successfully' }
  }
}
