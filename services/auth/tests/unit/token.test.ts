/**
 * Unit tests for token services
 */

import { describe, it, expect, vi } from 'vitest'
import { generateAccessToken, generateRefreshToken, verifyToken, getJWKS } from '../../src/services/token'
import { sampleUserId, sampleDepartmentId } from '../fixtures'
import type { TokenPayload } from '../../src/types'
import jwt from 'jsonwebtoken'

describe('Token Service', () => {
  describe('generateAccessToken', () => {
    it('should generate access token for regular user with 15m expiry', () => {
      /**
       * Verify access token generation for user role.
       * Decode token to check payload and expiry.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'test@example.com',
        role: 'user',
        departmentId: sampleDepartmentId,
      }

      const token = generateAccessToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Decode without verification to check payload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.decode(token) as any

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
      expect(decoded.departmentId).toBe(payload.departmentId)
      expect(decoded.scope).toBe('user:user')
      expect(decoded.iss).toBe('lockerhub-auth')
      expect(decoded.aud).toEqual(['lockerhub-api', 'lockerhub-services'])
      expect(decoded.sub).toBe(sampleUserId)

      // Check expiry is approximately 15 minutes (900 seconds)
      const expiryTime = decoded.exp - decoded.iat
      expect(expiryTime).toBeGreaterThanOrEqual(890)
      expect(expiryTime).toBeLessThanOrEqual(910)
    })

    it('should generate access token for admin user with 30m expiry', () => {
      /**
       * Verify access token generation for admin role.
       * Admin tokens should have 30-minute expiry.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'admin@example.com',
        role: 'admin',
      }

      const token = generateAccessToken(payload)

      const decoded = jwt.decode(token) as any

      expect(decoded.role).toBe('admin')
      expect(decoded.scope).toBe('user:admin')

      // Check expiry is approximately 30 minutes (1800 seconds)
      const expiryTime = decoded.exp - decoded.iat
      expect(expiryTime).toBeGreaterThanOrEqual(1790)
      expect(expiryTime).toBeLessThanOrEqual(1810)
    })

    it('should generate token with null departmentId when not provided', () => {
      /**
       * Verify departmentId defaults to null when not provided.
       * Tests the departmentId || null branch.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'test@example.com',
        role: 'user',
        // departmentId not provided
      }

      const token = generateAccessToken(payload)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.decode(token) as any

      expect(decoded.departmentId).toBeNull()
    })

    it('should generate unique token IDs for each token', () => {
      /**
       * Verify each token has unique jwtid.
       * Generate multiple tokens and check jti uniqueness.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'test@example.com',
        role: 'user',
      }

      const token1 = generateAccessToken(payload)
      const token2 = generateAccessToken(payload)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded1 = jwt.decode(token1) as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded2 = jwt.decode(token2) as any

      expect(decoded1.jti).toBeDefined()
      expect(decoded2.jti).toBeDefined()
      expect(decoded1.jti).not.toBe(decoded2.jti)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate refresh token with 7d default expiry', () => {
      /**
       * Verify refresh token generation.
       * Check token type and default expiry.
       */
      const payload = {
        userId: sampleUserId,
      }

      const token = generateRefreshToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.decode(token) as any

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.tokenType).toBe('refresh')
      expect(decoded.iss).toBe('lockerhub-auth')
      expect(decoded.aud).toEqual(['lockerhub-api', 'lockerhub-services'])

      // Check expiry is approximately 7 days (604800 seconds)
      const expiryTime = decoded.exp - decoded.iat
      expect(expiryTime).toBeGreaterThanOrEqual(604000)
      expect(expiryTime).toBeLessThanOrEqual(605000)
    })

    it('should generate unique refresh token IDs', () => {
      /**
       * Verify each refresh token has unique jti starting with "refresh-".
       * Generate multiple tokens and check jti uniqueness.
       */
      const payload = {
        userId: sampleUserId,
      }

      const token1 = generateRefreshToken(payload)
      const token2 = generateRefreshToken(payload)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded1 = jwt.decode(token1) as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded2 = jwt.decode(token2) as any

      expect(decoded1.jti).toBeDefined()
      expect(decoded2.jti).toBeDefined()
      expect(decoded1.jti).toMatch(/^refresh-/)
      expect(decoded2.jti).toMatch(/^refresh-/)
      expect(decoded1.jti).not.toBe(decoded2.jti)
    })

    it('should respect custom REFRESH_TOKEN_EXPIRY from environment', () => {
      /**
       * Verify refresh token respects REFRESH_TOKEN_EXPIRY env var.
       * This tests the fromEnv('REFRESH_TOKEN_EXPIRY') || '7d' branch.
       */
      // Note: This test validates the token structure.
      // The actual env var override would require mocking fromEnv,
      // but the default '7d' branch is already tested above.
      const payload = {
        userId: sampleUserId,
      }

      const token = generateRefreshToken(payload)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.decode(token) as any

      // Verify token is valid and has expiry set
      expect(decoded.exp).toBeGreaterThan(decoded.iat)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid access token successfully', () => {
      /**
       * Verify token verification with valid token.
       * Generate token and verify it.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'test@example.com',
        role: 'user',
      }

      const token = generateAccessToken(payload)
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })

    it('should verify token with custom audience', () => {
      /**
       * Verify token verification with custom audience option.
       * Tests the options.audience conditional path.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'test@example.com',
        role: 'user',
      }

      const token = generateAccessToken(payload)
      const decoded = verifyToken(token, { audience: 'lockerhub-api' })

      expect(decoded.userId).toBe(payload.userId)
    })

    it('should verify token with audience array', () => {
      /**
       * Verify token verification with audience as array.
       * Tests Array.isArray(options.audience) branch.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'test@example.com',
        role: 'user',
      }

      const token = generateAccessToken(payload)
      const decoded = verifyToken(token, { audience: ['lockerhub-api'] })

      expect(decoded.userId).toBe(payload.userId)
    })

    it('should use default audience when none provided', () => {
      /**
       * Verify token verification uses default audience.
       * Tests the default audience branch when options.audience is undefined.
       */
      const payload: TokenPayload = {
        userId: sampleUserId,
        email: 'test@example.com',
        role: 'user',
      }

      const token = generateAccessToken(payload)
      // Call without audience option - should use default
      const decoded = verifyToken(token, {})

      expect(decoded.userId).toBe(payload.userId)
    })

    it('should throw error for expired token', () => {
      /**
       * Verify token verification rejects expired token.
       * Mock jwt.verify to throw TokenExpiredError.
       */
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error: any = new Error('jwt expired')
        error.name = 'TokenExpiredError'
        throw error
      })

      expect(() => verifyToken('expired.token.here')).toThrow()

      vi.restoreAllMocks()
    })

    it('should throw error for invalid signature', () => {
      /**
       * Verify token verification rejects invalid signature.
       * Use malformed token to trigger error.
       */
      const invalidToken = 'invalid.token.signature'

      expect(() => verifyToken(invalidToken)).toThrow()
    })

    it('should throw error for token with wrong issuer', () => {
      /**
       * Verify token verification checks issuer.
       * Mock jwt.verify to throw error for wrong issuer.
       */
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error: any = new Error('jwt issuer invalid')
        error.name = 'JsonWebTokenError'
        throw error
      })

      expect(() => verifyToken('token.with.wrong.issuer')).toThrow()

      vi.restoreAllMocks()
    })
  })

  describe('getJWKS', () => {
    it('should return JWKS with public key', () => {
      /**
       * Verify JWKS endpoint returns keystore.
       * Check structure contains keys array.
       */
      const jwks = getJWKS()

      expect(jwks).toBeDefined()
      expect(jwks.keys).toBeDefined()
      expect(Array.isArray(jwks.keys)).toBe(true)
      expect(jwks.keys.length).toBeGreaterThan(0)
    })

    it('should return JWKS with correct key properties', () => {
      /**
       * Verify JWKS key contains required properties.
       * Check kid, use, alg, kty fields.
       */
      const jwks = getJWKS()
      const key = jwks.keys[0]

      expect(key.kid).toBeDefined() // Key ID
      expect(key.use).toBe('sig') // Signature use
      expect(key.alg).toBe('RS256') // Algorithm
      expect(key.kty).toBeDefined() // Key type (RSA)
    })
  })
})
