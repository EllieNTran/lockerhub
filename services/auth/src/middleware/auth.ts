import { Response, NextFunction } from 'express'
import { verifyToken } from '../services/token'
import logger from '../logger'
import type { AuthenticatedRequest, AppError, RequestUser } from '../types'

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'No token provided' })
    return
  }

  try {
    const decoded = verifyToken(token)

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      departmentId: decoded.departmentId || null,
    } as RequestUser

    next()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.warn({ error: message }, 'Invalid token')

    const err = new Error('Invalid or expired token') as AppError
    err.status = 401
    res.status(401).json({ message: err.message })
  }
}
