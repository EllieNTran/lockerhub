import { Router } from 'express'
import { query } from '../connectors/db'
import logger from '../logger'

const router = Router()

/**
 * GET /auth/metadata/departments
 * Get list of all departments
 */
router.get('/departments', async (_req, res, next) => {
  try {
    const result = await query<{ department_id: string; name: string }>(
      `SELECT department_id, name 
       FROM lockerhub.departments 
       ORDER BY name ASC`,
    )

    res.json({
      departments: result.rows.map(row => ({
        id: row.department_id,
        name: row.name,
      })),
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching departments')
    next(error)
  }
})


/**
 * GET /auth/metadata/offices
 * Get list of all office locations from enum
 */
router.get('/offices', async (_req, res, next) => {
  try {
    const result = await query<{ enumlabel: string }>(
      `SELECT enumlabel 
       FROM pg_enum 
       WHERE enumtypid = 'lockerhub.office'::regtype
       ORDER BY enumsortorder`,
    )

    res.json({
      offices: result.rows.map(row => row.enumlabel),
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching offices')
    next(error)
  }
})


/**
 * GET /auth/metadata/validate-staff-number/:staffNumber
 * Check if staff number is available (not taken)
 */
router.get('/validate-staff-number/:staffNumber', async (req, res, next) => {
  try {
    const { staffNumber } = req.params

    if (!staffNumber || staffNumber.length !== 8) {
      return res.json({
        available: false,
        message: 'Staff number must be exactly 8 characters',
      })
    }

    const result = await query<{ user_id: string }>(
      `SELECT user_id 
       FROM lockerhub.users 
       WHERE staff_number = $1`,
      [staffNumber],
    )

    const isAvailable = result.rows.length === 0

    res.json({
      available: isAvailable,
      message: isAvailable
        ? 'Staff number is available'
        : 'Staff number already in use',
    })
  } catch (error) {
    logger.error({ error }, 'Error validating staff number')
    next(error)
  }
})

export default router
