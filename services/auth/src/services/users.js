import { query } from '../connectors/db.js'
import logger from '../logger.js'

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserByEmail = async (email) => {
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
      [email]
    )

    return result.rows[0] || null
  } catch (error) {
    logger.error({ error, email }, 'Error finding user by email')
    throw error
  }
}

/**
 * Find user by ID
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserById = async (userId) => {
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
      [userId]
    )

    return result.rows[0] || null
  } catch (error) {
    logger.error({ error, userId }, 'Error finding user by ID')
    throw error
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.email - Email
 * @param {string} userData.passwordHash - Hashed password
 * @param {string} [userData.role] - User role (default: 'user')
 * @param {string} [userData.staffNumber] - Staff number
 * @param {string} [userData.departmentId] - Department ID
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
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
      [firstName, lastName, email, passwordHash, role, staffNumber, departmentId]
    )

    return result.rows[0]
  } catch (error) {
    logger.error({ error, email }, 'Error creating user')
    throw error
  }
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} passwordHash - New hashed password
 * @returns {Promise<boolean>} Success status
 */
export const updateUserPassword = async (userId, passwordHash) => {
  try {
    const result = await query(
      `UPDATE lockerhub.users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2`,
      [passwordHash, userId]
    )

    return result.rowCount > 0
  } catch (error) {
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
