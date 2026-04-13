/**
 * Unit tests for token blacklist services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { blacklistToken, isTokenBlacklisted, cleanupExpiredTokens } from '../../src/services/token-blacklist'
import * as db from '../../src/connectors/db'
import { createMockQueryResult, sampleUserId } from '../fixtures'

vi.mock('../../src/connectors/db')

describe('Token Blacklist Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('blacklistToken', () => {
    it('should successfully add token to blacklist', async () => {
      /**
       * Verify token is hashed and added to blacklist table.
       * Mock database insert operation.
       */
      const token = 'sample.refresh.token'
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const mockResult = createMockQueryResult([])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      await blacklistToken(token, sampleUserId, expiresAt)

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lockerhub.refresh_token_blacklist'),
        expect.arrayContaining([
          expect.any(String), // token hash
          sampleUserId,
          expiresAt,
        ]),
      )

      // Verify token was hashed (hash should be 64 chars for SHA-256)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callArgs = (db.query as any).mock.calls[0][1]
      const tokenHash = callArgs[0]
      expect(tokenHash).toHaveLength(64)
      expect(tokenHash).toMatch(/^[a-f0-9]+$/) // Hex string
    })

    it('should handle duplicate token insertion gracefully with ON CONFLICT', async () => {
      /**
       * Verify ON CONFLICT DO NOTHING handles duplicate tokens.
       * Mock database to simulate conflict scenario.
       */
      const token = 'duplicate.token'
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const mockResult = createMockQueryResult([])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      await blacklistToken(token, sampleUserId, expiresAt)

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (token_hash) DO NOTHING'),
        expect.any(Array),
      )
    })

    it('should handle database errors during blacklisting', async () => {
      /**
       * Verify error handling during token blacklist insertion.
       * Mock database to throw error.
       */
      const token = 'error.token'
      const expiresAt = new Date()

      vi.spyOn(db, 'query').mockRejectedValue(new Error('Database error'))

      await expect(blacklistToken(token, sampleUserId, expiresAt)).rejects.toThrow('Database error')
    })

    it('should hash different tokens differently', async () => {
      /**
       * Verify different tokens produce different hashes.
       * Test hash function consistency.
       */
      const token1 = 'token.one'
      const token2 = 'token.two'
      const expiresAt = new Date()

      vi.spyOn(db, 'query').mockResolvedValue(createMockQueryResult([]))

      await blacklistToken(token1, sampleUserId, expiresAt)
      await blacklistToken(token2, sampleUserId, expiresAt)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call1Args = (db.query as any).mock.calls[0][1]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call2Args = (db.query as any).mock.calls[1][1]

      const hash1 = call1Args[0]
      const hash2 = call2Args[0]

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      /**
       * Verify function returns true when token exists in blacklist.
       * Mock database to return exists: true.
       */
      const token = 'blacklisted.token'

      const mockResult = createMockQueryResult([{ exists: true }])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await isTokenBlacklisted(token)

      expect(result).toBe(true)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS'),
        expect.arrayContaining([expect.any(String)]),
      )

      // Verify query checks expiry with expires_at > NOW()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryString = (db.query as any).mock.calls[0][0]
      expect(queryString).toContain('expires_at > NOW()')
    })

    it('should return false for non-blacklisted token', async () => {
      /**
       * Verify function returns false when token is not in blacklist.
       * Mock database to return exists: false.
       */
      const token = 'valid.token'

      const mockResult = createMockQueryResult([{ exists: false }])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await isTokenBlacklisted(token)

      expect(result).toBe(false)
    })

    it('should return false when query returns empty result', async () => {
      /**
       * Verify function returns false when query returns no rows.
       * Tests the || false fallback for undefined rows[0].
       */
      const token = 'unknown.token'

      const mockResult = createMockQueryResult([])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const result = await isTokenBlacklisted(token)

      expect(result).toBe(false)
    })

    it('should handle database errors during check', async () => {
      /**
       * Verify error handling during blacklist check.
       * Mock database to throw error.
       */
      const token = 'error.token'

      vi.spyOn(db, 'query').mockRejectedValue(new Error('Connection timeout'))

      await expect(isTokenBlacklisted(token)).rejects.toThrow('Connection timeout')
    })

    it('should hash token before checking blacklist', async () => {
      /**
       * Verify token is hashed before database lookup.
       * Check that query parameter is a 64-char hex string.
       */
      const token = 'check.this.token'

      vi.spyOn(db, 'query').mockResolvedValue(createMockQueryResult([{ exists: false }]))

      await isTokenBlacklisted(token)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callArgs = (db.query as any).mock.calls[0][1]
      const tokenHash = callArgs[0]

      expect(tokenHash).toHaveLength(64)
      expect(tokenHash).toMatch(/^[a-f0-9]+$/)
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens and return count', async () => {
      /**
       * Verify cleanup deletes tokens where expires_at <= NOW().
       * Mock database to return deleted count.
       */
      const mockResult = createMockQueryResult([{ count: 5 }])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const count = await cleanupExpiredTokens()

      expect(count).toBe(5)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM lockerhub.refresh_token_blacklist'),
      )

      // Verify query has WHERE expires_at <= NOW() condition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryString = (db.query as any).mock.calls[0][0]
      expect(queryString).toContain('expires_at <= NOW()')
      expect(queryString).toContain('WITH deleted AS')
      expect(queryString).toContain('RETURNING *')
    })

    it('should return 0 when no expired tokens exist', async () => {
      /**
       * Verify function returns 0 when no tokens are deleted.
       * Mock database to return count: 0.
       */
      const mockResult = createMockQueryResult([{ count: 0 }])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const count = await cleanupExpiredTokens()

      expect(count).toBe(0)
    })

    it('should handle empty result with default to 0', async () => {
      /**
       * Verify function defaults to 0 when result is empty.
       * Tests the || '0' fallback for undefined count.
       */
      const mockResult = createMockQueryResult([])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const count = await cleanupExpiredTokens()

      expect(count).toBe(0)
    })

    it('should handle count as string and parse to integer', async () => {
      /**
       * Verify function parses string count to integer.
       * Mock database to return count as string (PostgreSQL behavior).
       */
      const mockResult = {
        rows: [{ count: '15' }],
        rowCount: 1,
        command: 'DELETE',
        fields: [],
        oid: 0,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'query').mockResolvedValue(mockResult as any)

      const count = await cleanupExpiredTokens()

      expect(count).toBe(15)
      expect(typeof count).toBe('number')
    })

    it('should handle database errors during cleanup', async () => {
      /**
       * Verify error handling during cleanup operation.
       * Mock database to throw error.
       */
      vi.spyOn(db, 'query').mockRejectedValue(new Error('Cleanup failed'))

      await expect(cleanupExpiredTokens()).rejects.toThrow('Cleanup failed')
    })

    it('should handle large cleanup counts', async () => {
      /**
       * Verify function handles large numbers correctly.
       * Test with count > 1000.
       */
      const mockResult = createMockQueryResult([{ count: 1500 }])
      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

      const count = await cleanupExpiredTokens()

      expect(count).toBe(1500)
    })
  })
})
