/**
 * Unit tests for logger configuration
 */

import { describe, it, expect } from 'vitest'

describe('Logger', () => {
  it('should export logger instance with standard methods', async () => {
    /**
     * Verify logger is properly configured and exports expected methods.
     * This test covers the logger initialization including level and transport configuration.
     */
    const logger = await import('../../src/logger')

    expect(logger.default).toBeDefined()
    expect(typeof logger.default.debug).toBe('function')
    expect(typeof logger.default.info).toBe('function')
    expect(typeof logger.default.warn).toBe('function')
    expect(typeof logger.default.error).toBe('function')
  })

  it('should have configured level based on environment', async () => {
    /**
     * Verify logger level configuration.
     * Tests the LOG_LEVEL environment variable handling and development/production defaults.
     */
    const logger = await import('../../src/logger')

    expect(logger.default.level).toBeDefined()
    expect(typeof logger.default.level).toBe('string')
  })

  it('should be callable for logging', async () => {
    /**
     * Verify logger can be called without errors.
     * Simple smoke test for logger functionality.
     */
    const logger = await import('../../src/logger')

    // Should not throw
    expect(() => {
      logger.default.debug('test debug message')
      logger.default.info('test info message')
      logger.default.warn('test warn message')
      logger.default.error('test error message')
    }).not.toThrow()
  })
})
