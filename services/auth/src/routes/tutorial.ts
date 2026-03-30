import express, { Response } from 'express'
import { updateTutorialStatus, getTutorialStatus } from '../services/tutorial'
import { asyncHandler } from '../utils/async-handler'
import { authenticateToken } from '../middleware/auth'
import type { AuthenticatedRequest } from '../types'

const router = express.Router()

/**
 * GET /auth/tutorial/status
 * Get tutorial status for the authenticated user
 */
router.get(
  '/status',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const result = await getTutorialStatus(userId)
    res.json(result)
  }),
)

/**
 * PATCH /auth/tutorial/complete
 * Mark tutorial as completed for the authenticated user
 */
router.patch(
  '/complete',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const result = await updateTutorialStatus(userId)
    res.json(result)
  }),
)

export default router
