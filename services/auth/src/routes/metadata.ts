import { Router } from 'express'
import { getDepartments, getOffices, checkAccountStatus, validateStaffNumber } from '../services/metadata'
import logger from '../logger'

const router = Router()

/**
 * GET /auth/metadata/departments
 * Get list of all departments
 */
router.get('/departments', async (_req, res, next) => {
  try {
    const departments = await getDepartments()
    res.json({ departments })
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
    const offices = await getOffices()
    res.json({ offices })
  } catch (error) {
    logger.error({ error }, 'Error fetching offices')
    next(error)
  }
})

/**
 * POST /auth/metadata/check-account
 * Check if account exists and its status
 */
router.post('/check-account', async (req, res, next) => {
  try {
    const { email } = req.body
    logger.info({ email }, 'Checking account status')
    const result = await checkAccountStatus(email)
    logger.info({ email, exists: result.exists, requiresActivation: result.requiresActivation }, 'Account check completed')
    res.json(result)
  } catch (error) {
    logger.error({ error }, 'Error checking account')
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
    const result = await validateStaffNumber(staffNumber)
    res.json(result)
  } catch (error) {
    logger.error({ error }, 'Error validating staff number')
    next(error)
  }
})

export default router
