import express, { Request, Response } from 'express'
import { signup, login, refresh, logout } from '../services/auth'
import { getJWKS } from '../services/token'
import { asyncHandler } from '../utils/async-handler'
import type { SignupRequest, LoginRequest, RefreshRequest, LogoutRequest } from '../types'

const router = express.Router()

/**
 * POST /auth/signup
 * Register a new user and return JWT tokens
 */
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, staffNumber, departmentId, office } = req.body as SignupRequest
  const result = await signup(firstName, lastName, email, password, staffNumber, departmentId, office)
  res.status(201).json(result)
}))

/**
 * POST /auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest
  const result = await login(email, password)
  res.json(result)
}))

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshRequest
  const result = await refresh(refreshToken)
  res.json(result)
}))

/**
 * GET /auth/.well-known/jwks.json
 * Get JSON Web Key Set for JWT verification
 */
router.get('/.well-known/jwks.json', (_req: Request, res: Response) => {
  res.json(getJWKS())
})

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as LogoutRequest
  const result = await logout(refreshToken)
  res.json(result)
}))

export default router
