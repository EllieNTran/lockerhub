// Validation middleware - requires express-validator package to be installed
// Commented out until express-validator is added to dependencies
/*
import { validationResult } from 'express-validator'
import { AppError } from './error-handler'
import type { Request, Response, NextFunction, RequestHandler } from 'express'

export const validate: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err: any) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }))

    const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR')
    error.errors = errorMessages
    throw error
  }

  next()
}
*/

// Placeholder export to prevent errors
import type { RequestHandler } from 'express'
export const validate: RequestHandler = (_req, _res, next) => next()
