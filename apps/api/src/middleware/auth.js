import jwt from 'jsonwebtoken'
import { AppError } from './error-handler.js'
import { fromEnv } from '../constants.js'

const JWT_SECRET = fromEnv('JWT_SECRET')

if (!JWT_SECRET && fromEnv('NODE_ENV') === 'production') {
  throw new Error('JWT_SECRET must be set in production')
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401)
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const decoded = jwt.verify(token, JWT_SECRET)

      req.user = {
        id: decoded.userId || decoded.sub,
        email: decoded.email,
        role: decoded.role,
        departmentId: decoded.departmentId,
      }

      next()
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401)
      }
      if (jwtError.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token', 401)
      }
      throw jwtError
    }
  } catch (error) {
    next(error)
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = {
          id: decoded.userId || decoded.sub,
          email: decoded.email,
          role: decoded.role,
          departmentId: decoded.departmentId,
        }
      } catch {
        // Ignore invalid tokens for optional auth
        req.user = null
      }
    }
    
    next()
  } catch (error) {
    next(error)
  }
}
