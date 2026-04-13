import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validate, validateParams } from '../../src/middleware/validate'

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
    }
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  describe('validate (body)', () => {
    it('should pass validation and call next() for valid data', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(1),
      })

      mockRequest.body = {
        email: 'test@example.com',
        name: 'John Doe',
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should return 400 error for invalid data', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(1),
      })

      mockRequest.body = {
        email: 'invalid-email',
        name: '',
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            path: 'email',
            message: expect.any(String),
          }),
          expect.objectContaining({
            path: 'name',
            message: expect.any(String),
          }),
        ]),
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle missing required fields', () => {
      const schema = z.object({
        userId: z.string().uuid(),
        floorNumber: z.string(),
      })

      mockRequest.body = {}

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation error',
          errors: expect.any(Array),
        }),
      )
    })

    it('should format nested path correctly', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      })

      mockRequest.body = {
        user: {
          profile: {
            email: 'not-an-email',
          },
        },
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: 'user.profile.email',
            }),
          ]),
        }),
      )
    })

    it('should call next with error for non-ZodError exceptions', () => {
      // Mock schema.parse to throw a non-ZodError
      const mockSchema = {
        parse: vi.fn(() => {
          throw new Error('Unexpected error')
        }),
      }

      mockRequest.body = { name: 'test' }

      const middleware = validate(mockSchema as unknown as z.ZodSchema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should validate with optional fields', () => {
      const schema = z.object({
        email: z.string().email(),
        phoneNumber: z.string().optional(),
      })

      mockRequest.body = {
        email: 'test@example.com',
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })
  })

  describe('validateParams', () => {
    it('should pass validation for valid params', () => {
      const schema = z.object({
        id: z.string().uuid(),
      })

      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const middleware = validateParams(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should return 400 error for invalid params', () => {
      const schema = z.object({
        id: z.string().uuid(),
      })

      mockRequest.params = {
        id: 'not-a-uuid',
      }

      const middleware = validateParams(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            path: 'id',
            message: expect.any(String),
          }),
        ]),
      })
    })

    it('should handle numeric params', () => {
      const schema = z.object({
        requestId: z.string().regex(/^\d+$/),
      })

      mockRequest.params = {
        requestId: '12345',
      }

      const middleware = validateParams(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should call next with error for non-ZodError exceptions', () => {
      // Mock schema.parse to throw a non-ZodError
      const mockSchema = {
        parse: vi.fn(() => {
          throw new Error('Unexpected error')
        }),
      }

      mockRequest.params = { id: 'test' }

      const middleware = validateParams(mockSchema as unknown as z.ZodSchema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should validate multiple params', () => {
      const schema = z.object({
        userId: z.string().uuid(),
        bookingId: z.string().uuid(),
      })

      mockRequest.params = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        bookingId: '987e6543-e21b-12d3-a456-426614174000',
      }

      const middleware = validateParams(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })
  })
})
