/**
 * Unit tests for database connector
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock pg module before importing db
const mockQuery = vi.fn()
const mockConnect = vi.fn()
const mockEnd = vi.fn()
const mockOn = vi.fn()

const _mockPoolInstance = {
  query: mockQuery,
  connect: mockConnect,
  end: mockEnd,
  on: mockOn,
}

vi.mock('pg', () => {
  return {
    default: {
      Pool: class Pool {
        query = mockQuery
        connect = mockConnect
        end = mockEnd
        on = mockOn
      },
    },
  }
})

// Mock logger
vi.mock('../../src/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('Database Connector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('query', () => {
    it('should execute a query successfully', async () => {
      /**
       * Verify query executes and returns result.
       * Mock pool.query to return mock result.
       */
      const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 }
      mockQuery.mockResolvedValue(mockResult)

      const { query } = await import('../../src/connectors/db')
      const result = await query('SELECT * FROM users WHERE id = $1', [1])

      expect(result.rows).toEqual([{ id: 1, name: 'test' }])
      expect(result.rowCount).toBe(1)
    })

    it('should handle query errors', async () => {
      /**
       * Verify error handling during query execution.
       * Mock pool.query to throw error.
       */
      const mockError = new Error('Query failed')
      mockQuery.mockRejectedValue(mockError)

      const { query } = await import('../../src/connectors/db')

      await expect(query('SELECT * FROM invalid')).rejects.toThrow('Query failed')
    })

    it('should pass parameters to query', async () => {
      /**
       * Verify query parameters are passed through correctly.
       */
      const mockResult = { rows: [], rowCount: 0 }
      mockQuery.mockResolvedValue(mockResult)

      const { query } = await import('../../src/connectors/db')
      await query('INSERT INTO users (name) VALUES ($1)', ['John'])

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO users (name) VALUES ($1)',
        ['John'],
      )
    })

    it('should log error when query fails', async () => {
      /**
       * Verify logger.error is called when query fails.
       */
      const mockError = new Error('Database error')
      mockQuery.mockRejectedValue(mockError)

      const { query } = await import('../../src/connectors/db')
      const logger = await import('../../src/logger')

      await expect(query('SELECT * FROM users')).rejects.toThrow('Database error')

      expect(logger.default.error).toHaveBeenCalledWith('Query error')
    })
  })

  describe('getClient', () => {
    it('should get a client from the pool', async () => {
      /**
       * Verify getClient returns client with query and release methods.
       */
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      }

      mockConnect.mockResolvedValue(mockClient)

      const { getClient } = await import('../../src/connectors/db')
      const client = await getClient()

      expect(mockConnect).toHaveBeenCalled()
      expect(client).toBeDefined()
      expect(typeof client.release).toBe('function')
    })

    it('should override release to cleanup timeout', async () => {
      /**
       * Verify release is overridden to clear timeout.
       */
      const originalRelease = vi.fn()
      const mockClient = {
        query: vi.fn(),
        release: originalRelease,
      }

      mockConnect.mockResolvedValue(mockClient)

      const { getClient } = await import('../../src/connectors/db')
      const client = await getClient()

      // Release should be overridden
      expect(client.release).not.toBe(originalRelease)

      // Call the overridden release
      client.release()

      // Original release should have been called
      expect(originalRelease).toHaveBeenCalled()
    })

    it('should clear timeout when client is released', async () => {
      /**
       * Verify timeout is cleared on release to prevent warning.
       */
      vi.useFakeTimers()

      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      }

      mockConnect.mockResolvedValue(mockClient)

      const { getClient } = await import('../../src/connectors/db')
      const client = await getClient()

      // Release the client immediately
      client.release()

      // Fast-forward time
      vi.advanceTimersByTime(6000)

      // Logger error should not be called since timeout was cleared
      const logger = await import('../../src/logger')
      expect(logger.default.error).not.toHaveBeenCalledWith(
        'Client has been checked out for more than 5 seconds',
      )

      vi.useRealTimers()
    })

    it('should restore original query and release methods', async () => {
      /**
       * Verify original client methods are restored on release.
       */
      const originalQuery = vi.fn()
      const originalRelease = vi.fn()
      const mockClient = {
        query: originalQuery,
        release: originalRelease,
      }

      mockConnect.mockResolvedValue(mockClient)

      const { getClient } = await import('../../src/connectors/db')
      const client = await getClient()

      // Methods should be bound
      expect(client.query).toBeDefined()
      expect(client.release).not.toBe(originalRelease)

      // Call release
      client.release()

      // Original release should have been restored (even if bound)
      expect(originalRelease).toHaveBeenCalled()
    })

    it('should log warning if client is checked out too long', async () => {
      /**
       * Verify warning is logged when client exceeds 5 second checkout.
       */
      vi.useFakeTimers()

      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      }

      mockConnect.mockResolvedValue(mockClient)

      const { getClient } = await import('../../src/connectors/db')
      const client = await getClient()

      // Don't release the client, let the timeout fire
      vi.advanceTimersByTime(6000)

      const logger = await import('../../src/logger')
      expect(logger.default.error).toHaveBeenCalledWith(
        'Client has been checked out for more than 5 seconds',
      )

      // Cleanup
      client.release()
      vi.useRealTimers()
    })
  })

  describe('Pool Event Handlers', () => {
    it('should log when pool connection is established', async () => {
      /**
       * Verify pool 'connect' event handler logs debug message.
       */
      const logger = await import('../../src/logger')
      vi.clearAllMocks()

      // Reset modules to trigger re-registration
      vi.resetModules()

      // Re-import to trigger pool initialization and event registration
      await import('../../src/connectors/db')

      // Find the 'connect' event handler that was registered
      const connectCalls = mockOn.mock.calls.filter(call => call[0] === 'connect')
      expect(connectCalls.length).toBeGreaterThan(0)

      const connectHandler = connectCalls[0][1]

      // Trigger the connect event handler
      connectHandler()

      // Verify logger.debug was called
      expect(logger.default.debug).toHaveBeenCalledWith('Database connection established')
    })

    it('should log error when pool emits error event', async () => {
      /**
       * Verify pool 'error' event handler logs error.
       */
      const logger = await import('../../src/logger')
      vi.clearAllMocks()

      // Reset modules to trigger re-registration
      vi.resetModules()

      // Re-import to trigger pool initialization
      await import('../../src/connectors/db')

      // Find the 'error' event handler that was registered
      const errorCalls = mockOn.mock.calls.filter(call => call[0] === 'error')
      expect(errorCalls.length).toBeGreaterThan(0)

      const errorHandler = errorCalls[0][1]

      // Trigger the error event handler
      errorHandler()

      // Verify logger.error was called
      expect(logger.default.error).toHaveBeenCalledWith('Unexpected database error')
    })

    it('should gracefully shutdown pool on SIGTERM', async () => {
      /**
       * Verify SIGTERM handler closes pool gracefully.
       */
      const logger = await import('../../src/logger')
      vi.clearAllMocks()

      // Setup process.on spy before importing
      const processOnSpy = vi.spyOn(process, 'on')

      // Reset and re-import db.ts to register handlers
      vi.resetModules()
      await import('../../src/connectors/db')

      // Find the SIGTERM handler
      const sigtermCalls = processOnSpy.mock.calls.filter(call => call[0] === 'SIGTERM')
      expect(sigtermCalls.length).toBeGreaterThan(0)

      const sigtermHandler = sigtermCalls[0][1] as () => Promise<void>

      // Mock pool.end to be called
      mockEnd.mockResolvedValue(undefined)

      // Trigger SIGTERM handler
      await sigtermHandler()

      // Verify pool.end was called
      expect(mockEnd).toHaveBeenCalled()

      // Verify logger.info was called
      expect(logger.default.info).toHaveBeenCalledWith('Database pool closed')

      processOnSpy.mockRestore()
    })
  })
})
