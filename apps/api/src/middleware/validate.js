import { validationResult } from 'express-validator'
import { AppError } from './error-handler.js'

export const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }))

    const error = new AppError('Validation failed', 400, true)
    error.errors = errorMessages
    throw error
  }

  next()
}
