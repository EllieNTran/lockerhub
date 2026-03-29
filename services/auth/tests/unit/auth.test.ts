/**
 * Unit tests for authentication services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { signup, login, refresh, logout } from '../../src/services/auth'
import * as users from '../../src/services/users'
import * as token from '../../src/services/token'
import * as tokenBlacklist from '../../src/services/token-blacklist'
import {
  createMockUser,
  createMockPreRegisteredUser,
  createMockDecodedToken,
  validSignupData,
  validCredentials,
  sampleUserId,
} from '../fixtures'

interface MockError extends Error {
  status?: number
  code?: string
}

// Mock the database module
vi.mock('../../src/connectors/db')

describe('Authentication Services', () => {
  describe('signup', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully register a new user', async () => {
      /**
       * Verify successful user registration without conflicts.
       * Mock database returns no existing user and creates new user.
       */
      const mockUser = createMockUser({
        email: validSignupData.email,
        first_name: validSignupData.firstName,
        last_name: validSignupData.lastName,
      })

      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(null)
      vi.spyOn(users, 'createUser').mockResolvedValue(mockUser)
      vi.spyOn(token, 'generateAccessToken').mockReturnValue('mock-access-token')
      vi.spyOn(token, 'generateRefreshToken').mockReturnValue('mock-refresh-token')

      const result = await signup(
        validSignupData.firstName,
        validSignupData.lastName,
        validSignupData.email,
        validSignupData.password,
        validSignupData.staffNumber,
        validSignupData.departmentId,
        validSignupData.office,
      )

      expect(result).toHaveProperty('accessToken', 'mock-access-token')
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token')
      expect(result.user).toMatchObject({
        email: validSignupData.email,
        firstName: validSignupData.firstName,
        lastName: validSignupData.lastName,
      })
      expect(users.findUserByEmail).toHaveBeenCalledWith(validSignupData.email)
      expect(users.createUser).toHaveBeenCalled()
    })

    it('should throw error for missing required fields', async () => {
      /**
       * Verify validation for required fields.
       * Expect error when firstName is missing.
       */
      await expect(
        signup('', 'Doe', 'test@example.com', 'password123', 'STF001', sampleUserId, 'Room 101'),
      ).rejects.toThrow('First name, last name, email, and password are required')
    })

    it('should throw error for existing email', async () => {
      /**
       * Verify signup fails when email already exists.
       * Mock database returns existing activated user.
       * Expect 409 conflict error.
       */
      const existingUser = createMockUser({ email: validSignupData.email })

      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(existingUser)

      try {
        await signup(
          validSignupData.firstName,
          validSignupData.lastName,
          validSignupData.email,
          validSignupData.password,
          validSignupData.staffNumber,
          validSignupData.departmentId,
          validSignupData.office,
        )
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toBe('User with this email already exists')
        expect(err.status).toBe(409)
      }
    })

    it('should throw error for pre-registered unactivated account', async () => {
      /**
       * Verify signup fails for pre-registered users who haven't activated.
       * Mock database returns pre-registered user without activation.
       * Expect specific error code ACCOUNT_NOT_ACTIVATED.
       */
      const preRegisteredUser = createMockPreRegisteredUser({ email: validSignupData.email })

      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(preRegisteredUser)

      try {
        await signup(
          validSignupData.firstName,
          validSignupData.lastName,
          validSignupData.email,
          validSignupData.password,
          validSignupData.staffNumber,
          validSignupData.departmentId,
          validSignupData.office,
        )
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toContain('activate your account')
        expect(err.status).toBe(409)
        expect(err.code).toBe('ACCOUNT_NOT_ACTIVATED')
      }
    })

    it('should throw error when staff details are missing for new signups', async () => {
      /**
       * Verify validation for staff-related fields.
       * Expect error when staffNumber, department, or office is missing.
       */
      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(null)

      await expect(
        signup(
          validSignupData.firstName,
          validSignupData.lastName,
          validSignupData.email,
          validSignupData.password,
          undefined, // missing staffNumber
          validSignupData.departmentId,
          validSignupData.office,
        ),
      ).rejects.toThrow('Staff number, department, and office are required')
    })
  })

  describe('login', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully login with valid credentials', async () => {
      /**
       * Verify successful authentication with valid email and password.
       * Mock database returns user with valid password hash.
       * Verify tokens are generated and returned.
       */
      const mockUser = createMockUser({ email: validCredentials.email })

      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(mockUser)
      vi.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true))
      vi.spyOn(token, 'generateAccessToken').mockReturnValue('mock-access-token')
      vi.spyOn(token, 'generateRefreshToken').mockReturnValue('mock-refresh-token')

      const result = await login(validCredentials.email, validCredentials.password)

      expect(result).toHaveProperty('accessToken', 'mock-access-token')
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token')
      expect(result.user).toHaveProperty('email', validCredentials.email)
    })

    it('should throw error for missing credentials', async () => {
      /**
       * Verify validation for required login fields.
       * Expect error when email or password is missing.
       */
      await expect(login('', 'password')).rejects.toThrow('Email and password are required')
      await expect(login('test@example.com', '')).rejects.toThrow('Email and password are required')
    })

    it('should throw error for non-existent user', async () => {
      /**
       * Verify login fails when user does not exist.
       * Mock database returns null for user lookup.
       * Expect 401 unauthorized error.
       */
      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(null)

      try {
        await login(validCredentials.email, validCredentials.password)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toBe('Invalid email or password')
        expect(err.status).toBe(401)
      }
    })

    it('should throw error for invalid password', async () => {
      /**
       * Verify login fails with incorrect password.
       * Mock bcrypt compare returns false.
       * Expect 401 unauthorized error.
       */
      const mockUser = createMockUser({ email: validCredentials.email })

      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(mockUser)
      vi.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false))

      try {
        await login(validCredentials.email, 'wrongpassword')
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toBe('Invalid email or password')
        expect(err.status).toBe(401)
      }
    })

    it('should throw error for unactivated pre-registered account', async () => {
      /**
       * Verify login fails for pre-registered users who haven't activated.
       * Mock database returns pre-registered user without password.
       * Expect 403 forbidden with ACCOUNT_NOT_ACTIVATED code.
       */
      const preRegisteredUser = createMockPreRegisteredUser({ email: validCredentials.email })

      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(preRegisteredUser)

      try {
        await login(validCredentials.email, validCredentials.password)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toContain('Account not activated')
        expect(err.status).toBe(403)
        expect(err.code).toBe('ACCOUNT_NOT_ACTIVATED')
      }
    })

    it('should throw error for account without password hash', async () => {
      /**
       * Verify login fails when account has no password set.
       * Edge case safety check for data integrity.
       */
      const mockUser = createMockUser({
        email: validCredentials.email,
        password_hash: null,
        is_pre_registered: false,
        account_activated: true,
      })

      vi.spyOn(users, 'findUserByEmail').mockResolvedValue(mockUser)

      try {
        await login(validCredentials.email, validCredentials.password)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toContain('Account not activated')
        expect(err.status).toBe(403)
        expect(err.code).toBe('ACCOUNT_NOT_ACTIVATED')
      }
    })
  })

  describe('refresh', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully refresh access token', async () => {
      /**
       * Verify successful token refresh with valid refresh token.
       * Mock token verification and user lookup.
       * Expect new access token to be generated.
       */
      const mockUser = createMockUser()
      const refreshToken = 'valid-refresh-token'
      const mockDecodedToken = createMockDecodedToken({ userId: mockUser.user_id, scope: 'refresh' })

      vi.spyOn(token, 'verifyToken').mockReturnValue(mockDecodedToken)
      vi.spyOn(tokenBlacklist, 'isTokenBlacklisted').mockResolvedValue(false)
      vi.spyOn(users, 'findUserById').mockResolvedValue(mockUser)
      vi.spyOn(token, 'generateAccessToken').mockReturnValue('new-access-token')

      const result = await refresh(refreshToken)

      expect(result).toHaveProperty('accessToken', 'new-access-token')
      expect(token.verifyToken).toHaveBeenCalledWith(refreshToken)
      expect(tokenBlacklist.isTokenBlacklisted).toHaveBeenCalledWith(refreshToken)
    })

    it('should throw error for missing refresh token', async () => {
      /**
       * Verify validation for required refresh token.
       * Expect error when token is not provided.
       */
      await expect(refresh('')).rejects.toThrow('Refresh token is required')
    })

    it('should throw error for invalid refresh token', async () => {
      /**
       * Verify error handling for invalid/expired tokens.
       * Mock token verification to throw error.
       */
      vi.spyOn(token, 'verifyToken').mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(refresh('invalid-token')).rejects.toThrow()
    })

    it('should throw error when user no longer exists', async () => {
      /**
       * Verify error when token is valid but user was deleted.
       * Mock user lookup returns null.
       * For security reasons, returns 'Invalid refresh token' instead of revealing user doesn't exist.
       */
      const mockDecodedToken = createMockDecodedToken({ userId: sampleUserId, scope: 'refresh' })

      vi.spyOn(token, 'verifyToken').mockReturnValue(mockDecodedToken)
      vi.spyOn(tokenBlacklist, 'isTokenBlacklisted').mockResolvedValue(false)
      vi.spyOn(users, 'findUserById').mockResolvedValue(null)

      try {
        await refresh('valid-token')
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toBe('Invalid refresh token')
        expect(err.status).toBe(401)
      }
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully logout user and blacklist token', async () => {
      /**
       * Verify successful logout operation.
       * Mock token verification and blacklisting.
       */
      const mockDecodedToken = createMockDecodedToken({ userId: sampleUserId })

      vi.spyOn(token, 'verifyToken').mockReturnValue(mockDecodedToken)
      vi.spyOn(tokenBlacklist, 'blacklistToken').mockResolvedValue()

      const result = await logout('some-refresh-token')

      expect(result).toHaveProperty('message', 'Logged out successfully')
      expect(tokenBlacklist.blacklistToken).toHaveBeenCalled()
    })

    it('should handle logout without token gracefully', async () => {
      /**
       * Verify logout can handle missing token.
       * Should still return success for client-side cleanup.
       */
      const result = await logout('')

      expect(result).toHaveProperty('message', 'Logged out successfully')
    })

    it('should handle logout with invalid token gracefully', async () => {
      /**
       * Verify logout handles invalid tokens gracefully.
       * Even if token verification fails, logout should succeed.
       */
      vi.spyOn(token, 'verifyToken').mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = await logout('invalid-token')

      expect(result).toHaveProperty('message', 'Logged out successfully')
    })

    it('should reject blacklisted token on refresh', async () => {
      /**
       * Verify that blacklisted tokens cannot be used to refresh.
       */
      const mockDecodedToken = createMockDecodedToken({ userId: sampleUserId, scope: 'refresh' })

      vi.spyOn(token, 'verifyToken').mockReturnValue(mockDecodedToken)
      vi.spyOn(tokenBlacklist, 'isTokenBlacklisted').mockResolvedValue(true)

      try {
        await refresh('blacklisted-token')
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        const err = error as MockError
        expect(err.message).toBe('Refresh token has been revoked')
        expect(err.status).toBe(401)
      }
    })
  })
})
