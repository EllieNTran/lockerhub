import express from 'express'
import { login, refresh, logout } from '../services/auth.js'
import { getJWKS } from '../services/token.js'
import { asyncHandler } from '../utils/async-handler.js'

const router = express.Router()

/**
 * POST /auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const result = await login(email, password)
  res.json(result)
}))

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  const result = await refresh(refreshToken)
  res.json(result)
}))

/**
 * GET /auth/.well-known/jwks.json
 * Get JSON Web Key Set for JWT verification
 */
router.get('/.well-known/jwks.json', (req, res) => {
  res.json(getJWKS())
})

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  const result = await logout(refreshToken)
  res.json(result)
}))

export default router
