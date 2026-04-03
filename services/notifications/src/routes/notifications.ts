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
  notifyKeyReturnReminder,
  notifyOverdueKeyReturn,
} from '../services/bookings'
import { notifyJoinedWaitingList, notifyRemovedFromWaitingList } from '../services/waiting-list'
import {
  notifySpecialRequestSubmitted,
  notifySpecialRequestApproved,
  notifySpecialRequestRejected,
} from '../services/special-requests'
import { asyncHandler } from '../utils/async-handler'
import { validate } from '../middleware/validate'
import {
  passwordResetSchema,
  activationSchema,
  createNotificationSchema,
  markAsReadSchema,
  bookingConfirmationSchema,
  bookingCancellationSchema,
  bookingExtensionSchema,
  keyReturnSchema,
  waitlistJoinedSchema,
  waitlistRemovedSchema,
  overdueKeyReturnSchema,
} from '../schemas/validation'
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
  validate(passwordResetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, resetLink } = req.body as SendPasswordResetEmailRequest

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
  validate(activationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, activationLink } = req.body as SendActivationEmailRequest

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
  validate(createNotificationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { title, adminTitle, caption, type, entityType, scope, createdBy, userIds, departmentId, floorId } =
      req.body as CreateNotificationRequest

    const result = await createNotification({
      title,
      adminTitle,
      caption,
      type,
      entityType,
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
  validate(markAsReadSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId as string
    const { userId } = req.body as MarkAsReadRequest

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
  validate(bookingConfirmationSchema),
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
      createdBy,
    } = req.body

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
      createdBy,
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
  validate(bookingCancellationSchema),
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
      adminBookingsPath,
    } = req.body

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
      adminBookingsPath,
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
  validate(bookingExtensionSchema),
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

/**
 * POST /notifications/booking/key-return-reminder
 * Send key return reminder notification and email
 */
router.post(
  '/booking/key-return-reminder',
  validate(keyReturnSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      keyNumber,
      keyReturnPath,
    } = req.body

    await notifyKeyReturnReminder(
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      keyNumber,
      keyReturnPath,
    )

    res.status(200).json({
      success: true,
      message: 'Key return reminder sent successfully',
    })
  }),
)

/**
 * POST /notifications/booking/overdue-key-return
 * Send overdue key return notification and email
 */
router.post(
  '/booking/overdue-key-return',
  asyncHandler(async (req: Request, res: Response) => {

    // Validate after logging
    const validationResult = overdueKeyReturnSchema.safeParse(req.body)
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues)
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues,
      })
      return
    }

    const {
      adminId,
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      keyNumber,
      keyReturnPath,
    } = req.body

    await notifyOverdueKeyReturn(
      adminId,
      userId,
      email,
      name,
      lockerNumber,
      floorNumber,
      startDate,
      endDate,
      keyNumber,
      keyReturnPath,
    )

    res.status(200).json({
      success: true,
      message: 'Overdue key return notification sent successfully',
    })
  }),
)

/**
 * POST /notifications/waitlist/joined
 * Send waitlist joined notification and email
 */
router.post(
  '/waitlist/joined',
  validate(waitlistJoinedSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      floorNumber,
      startDate,
      endDate,
    } = req.body

    await notifyJoinedWaitingList(
      userId,
      email,
      name,
      floorNumber,
      startDate,
      endDate,
    )

    res.status(200).json({
      success: true,
      message: 'Waitlist joined notification sent successfully',
    })
  }),
)

/**
 * POST /notifications/waitlist/removed
 * Send waitlist removed notification and email
 */
router.post(
  '/waitlist/removed',
  validate(waitlistRemovedSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      floorNumber,
      startDate,
      endDate,
    } = req.body

    await notifyRemovedFromWaitingList(
      userId,
      email,
      name,
      floorNumber,
      startDate,
      endDate,
    )

    res.status(200).json({
      success: true,
      message: 'Waitlist removed notification sent successfully',
    })
  }),
)

/**
 * POST /notifications/special-request/submitted
 * Send special request submitted notification and emails
 */
router.post(
  '/special-request/submitted',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      floorNumber,
      endDate,
      requestId,
      userSpecialRequestsPath,
      adminSpecialRequestsPath,
    } = req.body

    await notifySpecialRequestSubmitted(
      userId,
      email,
      name,
      floorNumber,
      endDate,
      requestId,
      userSpecialRequestsPath,
      adminSpecialRequestsPath,
    )

    res.status(200).json({
      success: true,
      message: 'Special request submitted notification sent successfully',
    })
  }),
)

/**
 * POST /notifications/special-request/approved
 * Send special request approved notification and email
 */
router.post(
  '/special-request/approved',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      floorNumber,
      endDate,
      requestId,
      userSpecialRequestsPath,
      createdBy,
    } = req.body

    await notifySpecialRequestApproved(
      userId,
      email,
      name,
      floorNumber,
      endDate,
      requestId,
      userSpecialRequestsPath,
      createdBy,
    )

    res.status(200).json({
      success: true,
      message: 'Special request approved notification sent successfully',
    })
  }),
)

/**
 * POST /notifications/special-request/rejected
 * Send special request rejected notification and email
 */
router.post(
  '/special-request/rejected',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      email,
      name,
      floorNumber,
      endDate,
      requestId,
      reason,
      userSpecialRequestsPath,
      createdBy,
    } = req.body

    await notifySpecialRequestRejected(
      userId,
      email,
      name,
      floorNumber,
      endDate,
      requestId,
      reason,
      userSpecialRequestsPath,
      createdBy,
    )

    res.status(200).json({
      success: true,
      message: 'Special request rejected notification sent successfully',
    })
  }),
)

export default router
