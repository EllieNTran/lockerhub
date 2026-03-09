import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, verifyToken } from './token'
import { findUserByEmail, findUserById, createUser } from './users'
import logger from '../logger'
import type { SignupResponse, LoginResponse, RefreshResponse, LogoutResponse, AppError } from '../types'

/** * Register a new user
 */
export const signup = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  staffNumber?: string,
  departmentId?: string,
): Promise<SignupResponse> => {
  if (!firstName || !lastName || !email || !password) {
    const error = new Error('First name, last name, email, and password are required') as AppError
    error.status = 400
    throw error
  }

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    logger.warn({ email }, 'Signup attempt with existing email')
    const error = new Error('User with this email already exists') as AppError
    error.status = 409
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
  } catch (error: any) {
    logger.warn({ error: error.message }, 'Invalid refresh token')
    const err = new Error('Invalid or expired refresh token') as AppError
    err.status = 401
    throw err
  }

  // TODO: Check if refresh token is blacklisted/revoked in database

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
export const logout = async (_refreshToken: string): Promise<LogoutResponse> => {
  // TODO: Add refresh token to blacklist in database

  logger.info('User logged out')

  return { message: 'Logged out successfully' }
}
