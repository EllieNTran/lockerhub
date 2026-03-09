import { verifyTokenWithJWKS } from '../utils/verify-jwt'
import logger from '../logger'
import { AppError } from './error-handler'
import type { Response, NextFunction, RequestHandler } from 'express'
import type { AuthenticatedRequest } from '../types'

/**
 * Authenticate requests using JWT verification with JWKS
 * Verifies JWT signature using cached public key from auth service
 */
export const authenticate = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      throw new AppError('Authorization header required', 401, 'MISSING_TOKEN')
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Invalid authorization header format. Expected: Bearer <token>', 401, 'INVALID_TOKEN_FORMAT')
    }

    const token = authHeader.substring(7) // Remove 'Bearer '

    try {
      const decoded = await verifyTokenWithJWKS(token)

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        departmentId: decoded.departmentId,
        scope: decoded.scope,
      }

      logger.debug({ userId: decoded.userId, role: decoded.role }, 'User authenticated')
      next()
    } catch (jwtError: unknown) {
      const message = jwtError instanceof Error ? jwtError.message : 'Unknown error'
      const name = jwtError instanceof Error ? jwtError.name : undefined
      logger.warn({ error: message }, 'JWT verification failed')

      if (name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED')
      }
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN')
    }
  } catch (error) {
    next(error)
  }
}

/**
 * Require specific role(s) to access endpoint
 * Must be used after authenticate middleware
 */
export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.userId, userRole: req.user.role, requiredRoles: allowedRoles },
        'Access denied - insufficient permissions',
      )
      return next(new AppError(
        `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        403,
        'FORBIDDEN',
      ))
    }

    logger.debug({ userId: req.user.userId, role: req.user.role }, 'Role authorization passed')
    next()
  }
}
