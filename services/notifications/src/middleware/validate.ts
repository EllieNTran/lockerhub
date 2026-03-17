import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues.map((err: z.core.$ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        })
        return
      }
      next(error)
    }
  }
}

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues.map((err: z.core.$ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        })
        return
      }
      next(error)
    }
  }
}
