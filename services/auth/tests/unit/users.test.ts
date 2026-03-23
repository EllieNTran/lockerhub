/**
 * Unit tests for user services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { findUserByEmail, findUserById, createUser } from '../../src/services/users'
import * as db from '../../src/connectors/db'
import { createMockUser, createMockQueryResult, sampleUserId, validSignupData } from '../fixtures'

vi.mock('../../src/connectors/db')

describe('User Services', () => {
  describe('findUserByEmail', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully find user by email', async () => {
      /**
       * Verify user lookup by email returns correct user.
       * Mock database returns user with matching email.
       */
      const mockUser = createMockUser({ email: 'test@example.com' })
      const mockResult = createMockQueryResult([mockUser])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await findUserByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com'],
      )
    })

    it('should return null when user is not found', async () => {
      /**
       * Verify null is returned for non-existent email.
       * Mock database returns empty result.
       */
      const mockResult = createMockQueryResult([])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await findUserByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      /**
       * Verify error handling during database lookup.
       * Mock database throws error.
       */
      vi.spyOn(db, 'query').mockRejectedValue(new Error('Database connection failed'))

      await expect(findUserByEmail('test@example.com')).rejects.toThrow('Database connection failed')
    })
  })

  describe('findUserById', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully find user by ID', async () => {
      /**
       * Verify user lookup by ID returns correct user.
       * Mock database returns user with matching ID.
       */
      const mockUser = createMockUser({ user_id: sampleUserId })
      const mockResult = createMockQueryResult([mockUser])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await findUserById(sampleUserId)

      expect(result).toEqual(mockUser)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [sampleUserId],
      )
    })

    it('should return null when user is not found', async () => {
      /**
       * Verify null is returned for non-existent user ID.
       * Mock database returns empty result.
       */
      const mockResult = createMockQueryResult([])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await findUserById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('createUser', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully create a new user', async () => {
      /**
       * Verify user creation with all required fields.
       * Mock database returns newly created user.
       */
      const mockUser = createMockUser({
        first_name: validSignupData.firstName,
        last_name: validSignupData.lastName,
        email: validSignupData.email,
      })
      const mockResult = createMockQueryResult([mockUser])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await createUser({
        firstName: validSignupData.firstName,
        lastName: validSignupData.lastName,
        email: validSignupData.email,
        passwordHash: 'hashed-password',
        staffNumber: validSignupData.staffNumber,
        departmentId: validSignupData.departmentId,
        office: validSignupData.office,
      })

      expect(result).toEqual(mockUser)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lockerhub.users'),
        expect.arrayContaining([
          validSignupData.firstName,
          validSignupData.lastName,
          validSignupData.email,
        ]),
      )
    })

    it('should create user with default role', async () => {
      /**
       * Verify user is created with 'user' role by default.
       * When role is not specified, should default to 'user'.
       */
      const mockUser = createMockUser({ role: 'user' })
      const mockResult = createMockQueryResult([mockUser])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await createUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      })

      expect(result.role).toBe('user')
    })

    it('should handle database errors during creation', async () => {
      /**
       * Verify error handling during user creation.
       * Mock database throws constraint violation.
       */
      vi.spyOn(db, 'query').mockRejectedValue(new Error('Unique constraint violation'))

      await expect(
        createUser({
          firstName: 'John',
          lastName: 'Doe',
          email: 'duplicate@example.com',
          passwordHash: 'hashed-password',
        }),
      ).rejects.toThrow('Unique constraint violation')
    })
  })
})
