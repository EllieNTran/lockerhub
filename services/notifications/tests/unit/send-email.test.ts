import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend
const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: class Resend {
    emails = {
      send: mockSend,
    }
  },
}))

// Mock logger
vi.mock('../../src/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock constants
vi.mock('../../src/constants', () => ({
  fromEnv: vi.fn((key: string) => {
    if (key === 'RESEND_API_KEY') return 'test-api-key'
    return undefined
  }),
}))

describe('Send Email Utility', () => {
  let sendEmail: typeof import('../../src/utils/send-email').default

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../../src/utils/send-email')
    sendEmail = module.default
  })

  it('should send email successfully', async () => {
    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    })

    await sendEmail(
      'user@example.com',
      { name: 'John', lockerNumber: 'DL10-01-01' },
      'template-123',
      'booking confirmation',
    )

    expect(mockSend).toHaveBeenCalledWith({
      from: 'LockerHub <onboarding@resend.dev>',
      to: 'ellie.tran18@gmail.com',
      template: {
        id: 'template-123',
        variables: {
          name: 'John',
          lockerNumber: 'DL10-01-01',
        },
      },
    })

    const logger = await import('../../src/logger')
    expect(logger.default.info).toHaveBeenCalledWith('booking confirmation email sent successfully')
  })

  it('should handle Resend API errors', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: {
        message: 'Invalid API key',
        name: 'validation_error',
      },
    })

    await expect(
      sendEmail(
        'user@example.com',
        { name: 'John' },
        'template-123',
        'test email',
      ),
    ).rejects.toThrow('Failed to send email: Invalid API key')

    const logger = await import('../../src/logger')
    expect(logger.default.error).toHaveBeenCalledWith('Resend API error: Invalid API key')
  })

  it('should handle network errors', async () => {
    mockSend.mockRejectedValue(new Error('Network error'))

    await expect(
      sendEmail(
        'user@example.com',
        { name: 'John' },
        'template-123',
        'test email',
      ),
    ).rejects.toThrow('Network error')

    const logger = await import('../../src/logger')
    expect(logger.default.error).toHaveBeenCalledWith('Failed to send test email email')
  })

  it('should log debug information before sending', async () => {
    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    })

    await sendEmail(
      'user@example.com',
      { floorNumber: '10', startDate: '2026-04-15' },
      'template-456',
      'waitlist notification',
    )

    const logger = await import('../../src/logger')
    expect(logger.default.debug).toHaveBeenCalledWith(
      {
        emailPayload: {
          from: 'LockerHub <onboarding@resend.dev>',
          to: 'ellie.tran18@gmail.com',
          template: {
            id: 'template-456',
            variables: {
              floorNumber: '10',
              startDate: '2026-04-15',
            },
          },
        },
        emailType: 'waitlist notification',
      },
      'Attempting to send waitlist notification email',
    )
  })

  it('should handle empty variables object', async () => {
    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    })

    await sendEmail(
      'user@example.com',
      {},
      'template-789',
      'simple notification',
    )

    expect(mockSend).toHaveBeenCalledWith({
      from: 'LockerHub <onboarding@resend.dev>',
      to: 'ellie.tran18@gmail.com',
      template: {
        id: 'template-789',
        variables: {},
      },
    })
  })

  it('should handle numeric variables', async () => {
    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    })

    await sendEmail(
      'user@example.com',
      { requestId: 12345, queuePosition: 3 },
      'template-101',
      'queue update',
    )

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        template: {
          id: 'template-101',
          variables: {
            requestId: 12345,
            queuePosition: 3,
          },
        },
      }),
    )
  })

  it('should use hardcoded recipient email in development', async () => {
    mockSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    })

    // Pass a different email, but expect hardcoded one to be used
    await sendEmail(
      'different-user@example.com',
      { name: 'Test' },
      'template-123',
      'test',
    )

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ellie.tran18@gmail.com', // Hardcoded in development
      }),
    )
  })
})
