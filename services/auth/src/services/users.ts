import { query } from '../connectors/db'
import logger from '../logger'
import type { User } from '../types'

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await query(
      `SELECT 
        user_id, 
        first_name, 
        last_name, 
        email, 
        password_hash, 
        role,
        staff_number,
        department_id,
        created_at
      FROM lockerhub.users 
      WHERE email = $1`,
      [email],
    )

    return result.rows[0] || null
  } catch (error: any) {
    logger.error({ error, email }, 'Error finding user by email')
    throw error
  }
}

/**
 * Find user by ID
 */
export const findUserById = async (userId: string): Promise<User | null> => {
  try {
    const result = await query(
      `SELECT 
        user_id, 
        first_name, 
        last_name, 
        email, 
        role,
        staff_number,
        department_id,
        created_at
      FROM lockerhub.users 
      WHERE user_id = $1`,
      [userId],
    )

    return result.rows[0] || null
  } catch (error: any) {
    logger.error({ error, userId }, 'Error finding user by ID')
    throw error
  }
}

/**
 * Create a new user
 */
export const createUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role?: string;
  staffNumber?: string | null;
  departmentId?: string | null;
}): Promise<User> => {
  const {
    firstName,
    lastName,
    email,
    passwordHash,
    role = 'user',
    staffNumber = null,
    departmentId = null,
  } = userData

  try {
    const result = await query(
      `INSERT INTO lockerhub.users 
        (first_name, last_name, email, password_hash, role, staff_number, department_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        user_id, 
        first_name, 
        last_name, 
        email, 
        role,
        staff_number,
        department_id,
        created_at`,
      [firstName, lastName, email, passwordHash, role, staffNumber, departmentId],
    )

    return result.rows[0]
  } catch (error: any) {
    logger.error({ error, email }, 'Error creating user')
    throw error
  }
}

/**
 * Update user password
 */
export const updateUserPassword = async (userId: string, passwordHash: string): Promise<boolean> => {
  try {
    const result = await query(
      `UPDATE lockerhub.users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2`,
      [passwordHash, userId],
    )

    return (result.rowCount ?? 0) > 0
  } catch (error: any) {
    logger.error({ error, userId }, 'Error updating user password')
    throw error
  }
}

export default {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
}
