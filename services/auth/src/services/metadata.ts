import { query } from '../connectors/db'
import type { AppError } from '../types'

/**
 * Get list of all departments
 */
export const getDepartments = async (): Promise<Array<{ id: string; name: string }>> => {
  const result = await query<{ department_id: string; name: string }>(
    `SELECT department_id, name 
     FROM lockerhub.departments 
     ORDER BY name ASC`,
  )

  return result.rows.map((row) => ({
    id: row.department_id,
    name: row.name,
  }))
}

/**
 * Get list of all office locations from enum
 */
export const getOffices = async (): Promise<string[]> => {
  const result = await query<{ enumlabel: string }>(
    `SELECT enumlabel 
     FROM pg_enum 
     WHERE enumtypid = 'lockerhub.office'::regtype
     ORDER BY enumsortorder`,
  )

  return result.rows.map((row) => row.enumlabel)
}

/**
 * Check if account exists and its status
 */
export const checkAccountStatus = async (
  email: string,
): Promise<{
  exists: boolean
  requiresActivation?: boolean
  name?: string
  email?: string
  message: string
}> => {
  if (!email) {
    const error = new Error('Email is required') as AppError
    error.status = 400
    throw error
  }

  const result = await query<{
    user_id: string
    email: string
    first_name: string
    is_pre_registered: boolean
    account_activated: boolean
  }>(
    `SELECT user_id, email, first_name, is_pre_registered, account_activated
     FROM lockerhub.users 
     WHERE email = $1`,
    [email],
  )

  if (result.rows.length === 0) {
    return {
      exists: false,
      message: 'No account found with this email. You can proceed with signup.',
    }
  }

  const user = result.rows[0]

  if (user.is_pre_registered && !user.account_activated) {
    return {
      exists: true,
      requiresActivation: true,
      name: user.first_name,
      email: user.email,
      message: `Welcome ${user.first_name}! Your account is pre-registered but needs activation.`,
    }
  }

  return {
    exists: true,
    requiresActivation: false,
    message: 'An account with this email already exists and is active. Please login instead.',
  }
}

/**
 * Validate staff number availability
 */
export const validateStaffNumber = async (
  staffNumber: string,
): Promise<{
  available: boolean
  message: string
  requiresActivation?: boolean
  email?: string
}> => {
  if (!staffNumber || staffNumber.length !== 8) {
    return {
      available: false,
      message: 'Staff number must be exactly 8 characters',
    }
  }

  const result = await query<{
    user_id: string
    is_pre_registered: boolean
    account_activated: boolean
    email: string
  }>(
    `SELECT user_id, is_pre_registered, account_activated, email
     FROM lockerhub.users 
     WHERE staff_number = $1`,
    [staffNumber],
  )

  if (result.rows.length === 0) {
    return {
      available: true,
      message: 'Staff number is available',
    }
  }

  const user = result.rows[0]

  if (user.is_pre_registered && !user.account_activated) {
    return {
      available: false,
      message: 'This staff number belongs to a pre-registered account that needs activation',
      requiresActivation: true,
      email: user.email,
    }
  }

  return {
    available: false,
    message: 'Staff number already in use',
    requiresActivation: false,
  }
}
