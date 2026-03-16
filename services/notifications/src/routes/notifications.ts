import express, { Request, Response } from 'express'
import { sendResetPasswordEmail, sendActivationEmail } from '../services/auth'
import {
  createNotification,
  markAsRead,
  getUserNotifications,
} from '../services/notifications'
import {
  notifyBookingConfirmation,
  notifyBookingCancellation,
  notifyBookingExtension,
} from '../services/bookings'
import { asyncHandler } from '../utils/async-handler'
import type {
  SendPasswordResetEmailRequest,
  SendActivationEmailRequest,
  CreateNotificationRequest,
  MarkAsReadRequest,
} from '../types'

const router = express.Router()

/**
 * POST /notifications/password-reset
 * Send password reset email
 */
router.post(
  '/password-reset',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, resetLink } = req.body as SendPasswordResetEmailRequest

    if (!email || !name || !resetLink) {
      res.status(400).json({
        success: false,
        message: 'Email, name, and resetLink are required',
      })
      return
    }

    await sendResetPasswordEmail(email, name, resetLink)

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    })
  }),
)

/**
 * POST /notifications/activation
 * Send account activation email
 */
router.post(
  '/activation',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, activationLink } = req.body as SendActivationEmailRequest

    if (!email || !name || !activationLink) {
      res.status(400).json({
        success: false,
        message: 'Email, name, and activationLink are required',
      })
      return
    }

    await sendActivationEmail(email, name, activationLink)

    res.status(200).json({
      success: true,
      message: 'Activation email sent successfully',
    })
  }),
)

/**
 * GET /notifications/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' })
})

/**
 * POST /notifications
 * Create a notification and assign to users based on scope
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, adminTitle, caption, type, scope, createdBy, userIds, departmentId, floorId } =
      req.body as CreateNotificationRequest

    if (!title || !scope) {
      res.status(400).json({
        success: false,
        message: 'Title and scope are required',
      })
      return
    }

    if (scope === 'user' && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      res.status(400).json({
        success: false,
        message: 'userIds (non-empty array) is required for user scope',
      })
      return
    }

    if (scope === 'department' && !departmentId) {
      res.status(400).json({
        success: false,
        message: 'departmentId is required for department scope',
      })
      return
    }

    if (scope === 'floor' && !floorId) {
      res.status(400).json({
        success: false,
        message: 'floorId is required for floor scope',
      })
      return
    }

    const result = await createNotification({
      title,
      adminTitle,
      caption,
      type,
      scope,
      createdBy,
      userIds,
      departmentId,
      floorId,
    })

    res.status(201).json(result)
  }),
)

/**
 * PUT /notifications/:notificationId/read
 * Mark a notification as read for a user
 */
router.put(
  '/:notificationId/read',
  asyncHandler(async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId as string
    const { userId } = req.body as MarkAsReadRequest

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'userId is required in request body',
      })
      return
    }

    const result = await markAsRead({ userId, notificationId })

    if (!result.success) {
      res.status(404).json(result)
      return
    }

    res.status(200).json(result)
  }),
)

/**
 * GET /notifications/user/:userId
 * Get all notifications for a user
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string
    const unreadOnly = req.query.unreadOnly === 'true'

    const result = await getUserNotifications({ userId, unreadOnly })

    res.status(200).json(result)
  }),
)

/**
 * POST /notifications/booking/confirmation
 * Send booking confirmation notification and emails
 */
router.post(
  '/booking/confirmation',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      userBookingsPath,
      adminBookingsPath,
    } = req.body

    if (!userId || !email || !name || !lockerNumber || !floorNumber || !startDate || !endDate || !userBookingsPath || !adminBookingsPath) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: userId, email, name, lockerNumber, floorNumber, startDate, endDate, userBookingsPath, adminBookingsPath',
      })
      return
    }

    await notifyBookingConfirmation(
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      userBookingsPath,
      adminBookingsPath,
    )

    res.status(200).json({
      success: true,
      message: 'Booking confirmation sent successfully',
    })
  }),
)

/**
 * POST /notifications/booking/cancellation
 * Send booking cancellation notification and emails
 */
router.post(
  '/booking/cancellation',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      keyStatus,
      keyNumber,
    } = req.body

    if (!userId || !email || !name || !lockerNumber || !floorNumber || !startDate || !endDate || !keyStatus || !keyNumber) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: userId, email, name, lockerNumber, floorNumber, startDate, endDate, keyStatus, keyNumber',
      })
      return
    }

    await notifyBookingCancellation(
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      keyStatus,
      keyNumber,
    )

    res.status(200).json({
      success: true,
      message: 'Booking cancellation sent successfully',
    })
  }),
)

/**
 * POST /notifications/booking/extension
 * Send booking extension notification and emails
 */
router.post(
  '/booking/extension',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      originalEndDate,
      newEndDate,
      userBookingsPath,
      adminBookingsPath,
    } = req.body

    if (!userId || !email || !name || !lockerNumber || !floorNumber || !originalEndDate || !newEndDate || !userBookingsPath || !adminBookingsPath) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: userId, email, name, lockerNumber, floorNumber, originalEndDate, newEndDate, userBookingsPath, adminBookingsPath',
      })
      return
    }

    await notifyBookingExtension(
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      originalEndDate,
      newEndDate,
      userBookingsPath,
      adminBookingsPath,
    )

    res.status(200).json({
      success: true,
      message: 'Booking extension sent successfully',
    })
  }),
)

export default router
