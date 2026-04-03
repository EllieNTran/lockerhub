/**
 * Integration tests for notification routes
 * Using supertest to test Express routes end-to-end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import notificationsRouter from '../../src/routes/notifications'
import * as authService from '../../src/services/auth'
import * as notificationService from '../../src/services/notifications'
import * as bookingService from '../../src/services/bookings'
import * as waitlistService from '../../src/services/waiting-list'
import * as specialRequestService from '../../src/services/special-requests'
import {
  validPasswordResetEmail,
  validActivationEmail,
  validNotificationRequest,
  userScopedNotificationRequest,
  validBookingConfirmation,
  validBookingCancellation,
  validBookingExtension,
  validKeyReturnReminder,
  validOverdueKeyReturn,
  validWaitlistJoined,
  validWaitlistRemoved,
  validSpecialRequestSubmitted,
  validSpecialRequestApproved,
  validSpecialRequestRejected,
  sampleUserId,
  sampleNotificationId,
  createMockNotificationWithReadStatus,
} from '../fixtures'

const app = express()
app.use(express.json())
app.use('/notifications', notificationsRouter)

// Mock the services
vi.mock('../../src/services/auth')
vi.mock('../../src/services/notifications')
vi.mock('../../src/services/bookings')
vi.mock('../../src/services/waiting-list')
vi.mock('../../src/services/special-requests')
vi.mock('../../src/connectors/db')

describe('Notification Routes Integration Tests', () => {
  describe('POST /notifications/password-reset', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send password reset email', async () => {
      /**
       * Verify end-to-end password reset email flow.
       * Mock service succeeds.
       * Expect 200 status with success message.
       */
      vi.mocked(authService.sendResetPasswordEmail).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/password-reset')
        .send(validPasswordResetEmail)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Password reset email sent')
      expect(authService.sendResetPasswordEmail).toHaveBeenCalledWith(
        validPasswordResetEmail.email,
        validPasswordResetEmail.name,
        validPasswordResetEmail.resetLink,
      )
    })

    it('should return 400 for missing required fields', async () => {
      /**
       * Verify validation for required fields.
       * Expect 400 status for invalid request.
       */
      const response = await request(app)
        .post('/notifications/password-reset')
        .send({ email: 'test@example.com' }) // missing name and resetLink

      expect(response.status).toBe(400)
    })

    it('should return 500 on service error', async () => {
      /**
       * Verify error handling when email service fails.
       * Mock service throws error.
       */
      vi.mocked(authService.sendResetPasswordEmail).mockRejectedValue(
        new Error('Email service unavailable'),
      )

      const response = await request(app)
        .post('/notifications/password-reset')
        .send(validPasswordResetEmail)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /notifications/activation', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send activation email', async () => {
      /**
       * Verify end-to-end activation email flow.
       * Mock service succeeds.
       * Expect 200 status with success message.
       */
      vi.mocked(authService.sendActivationEmail).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/activation')
        .send(validActivationEmail)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Activation email sent')
      expect(authService.sendActivationEmail).toHaveBeenCalledWith(
        validActivationEmail.email,
        validActivationEmail.name,
        validActivationEmail.activationLink,
      )
    })

    it('should return 400 for invalid request', async () => {
      /**
       * Verify validation for activation email.
       * Expect 400 status for missing fields.
       */
      const response = await request(app)
        .post('/notifications/activation')
        .send({ email: 'test@example.com' }) // missing name and activationLink

      expect(response.status).toBe(400)
    })
  })

  describe('GET /notifications/health', () => {
    it('should return health status', async () => {
      /**
       * Verify health check endpoint.
       * Expect 200 status with ok status.
       */
      const response = await request(app).get('/notifications/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('ok')
    })
  })

  describe('POST /notifications', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully create global notification', async () => {
      /**
       * Verify notification creation endpoint.
       * Mock service returns success.
       */
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        notification_id: sampleNotificationId,
        success: true,
        message: 'Notification created successfully',
      })

      const response = await request(app)
        .post('/notifications')
        .send(validNotificationRequest)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('notification_id')
    })

    it('should successfully create user-scoped notification', async () => {
      /**
       * Verify user-scoped notification creation.
       * Mock service handles user ID array.
       */
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        notification_id: sampleNotificationId,
        success: true,
        message: 'Notification created successfully',
      })

      const response = await request(app)
        .post('/notifications')
        .send(userScopedNotificationRequest)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'user',
          userIds: expect.arrayContaining([sampleUserId]),
        }),
      )
    })

    it('should return 400 for invalid scope', async () => {
      /**
       * Verify validation for notification scope.
       * Expect 400 for invalid scope value.
       */
      const response = await request(app)
        .post('/notifications')
        .send({
          ...validNotificationRequest,
          scope: 'invalid-scope',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /notifications/:id/read', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully mark notification as read', async () => {
      /**
       * Verify marking notification as read.
       * Mock service returns success.
       */
      vi.mocked(notificationService.markAsRead).mockResolvedValue({
        success: true,
        message: 'Notification marked as read successfully',
      })

      const response = await request(app)
        .put(`/notifications/${sampleNotificationId}/read`)
        .send({ userId: sampleUserId })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(notificationService.markAsRead).toHaveBeenCalledWith({
        userId: sampleUserId,
        notificationId: sampleNotificationId,
      })
    })

    it('should return 400 for missing userId', async () => {
      /**
       * Verify validation for required userId.
       */
      const response = await request(app)
        .put(`/notifications/${sampleNotificationId}/read`)
        .send({})

      expect(response.status).toBe(400)
    })

    it('should return 404 for already read notification', async () => {
      /**
       * Verify 404 response when notification is already marked as read.
       * Mock service returns success: false.
       */
      vi.mocked(notificationService.markAsRead).mockResolvedValue({
        success: false,
        message: 'Notification not found or already marked as read',
      })

      const response = await request(app)
        .put(`/notifications/${sampleNotificationId}/read`)
        .send({ userId: sampleUserId })

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /notifications/user/:userId', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully retrieve user notifications', async () => {
      /**
       * Verify user notifications retrieval.
       * Mock service returns notification list.
       */
      const mockNotifications = [
        createMockNotificationWithReadStatus({ read: false }),
        createMockNotificationWithReadStatus({ read: true }),
      ]

      vi.mocked(notificationService.getUserNotifications).mockResolvedValue({
        notifications: mockNotifications,
        total: 2,
        unread: 1,
      })

      const response = await request(app).get(`/notifications/user/${sampleUserId}`)

      expect(response.status).toBe(200)
      expect(response.body.notifications).toHaveLength(2)
      expect(response.body.unread).toBe(1)
    })

    it('should return empty array for user with no notifications', async () => {
      /**
       * Verify handling of user with no notifications.
       */
      vi.mocked(notificationService.getUserNotifications).mockResolvedValue({
        notifications: [],
        total: 0,
        unread: 0,
      })

      const response = await request(app).get(`/notifications/user/${sampleUserId}`)

      expect(response.status).toBe(200)
      expect(response.body.notifications).toHaveLength(0)
      expect(response.body.unread).toBe(0)
    })

    it('should filter unread notifications when requested', async () => {
      /**
       * Verify unread filter query parameter.
       */
      const mockNotifications = [createMockNotificationWithReadStatus({ read: false })]

      vi.mocked(notificationService.getUserNotifications).mockResolvedValue({
        notifications: mockNotifications,
        total: 1,
        unread: 1,
      })

      const response = await request(app).get(
        `/notifications/user/${sampleUserId}?unreadOnly=true`,
      )

      expect(response.status).toBe(200)
      expect(response.body.notifications).toHaveLength(1)
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: sampleUserId,
          unreadOnly: true,
        }),
      )
    })
  })

  describe('POST /notifications/booking/confirmation', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send booking confirmation', async () => {
      /**
       * Verify booking confirmation notification flow.
       * Mock service succeeds.
       */
      vi.mocked(bookingService.notifyBookingConfirmation).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/booking/confirmation')
        .send(validBookingConfirmation)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Booking confirmation sent')
      expect(bookingService.notifyBookingConfirmation).toHaveBeenCalledWith(
        validBookingConfirmation.userId,
        validBookingConfirmation.email,
        validBookingConfirmation.name,
        validBookingConfirmation.lockerNumber,
        validBookingConfirmation.floorNumber,
        validBookingConfirmation.startDate,
        validBookingConfirmation.endDate,
        validBookingConfirmation.userBookingsPath,
        validBookingConfirmation.adminBookingsPath,
        validBookingConfirmation.createdBy,
      )
    })

    it('should return 400 for missing required fields', async () => {
      /**
       * Verify validation for required fields.
       */
      const response = await request(app)
        .post('/notifications/booking/confirmation')
        .send({ userId: sampleUserId }) // missing other fields

      expect(response.status).toBe(400)
    })

    it('should return 500 on service error', async () => {
      /**
       * Verify error handling when service fails.
       */
      vi.mocked(bookingService.notifyBookingConfirmation).mockRejectedValue(
        new Error('Service error'),
      )

      const response = await request(app)
        .post('/notifications/booking/confirmation')
        .send(validBookingConfirmation)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /notifications/booking/cancellation', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send booking cancellation', async () => {
      /**
       * Verify booking cancellation notification flow.
       * Mock service succeeds.
       */
      vi.mocked(bookingService.notifyBookingCancellation).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/booking/cancellation')
        .send(validBookingCancellation)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(bookingService.notifyBookingCancellation).toHaveBeenCalledWith(
        validBookingCancellation.userId,
        validBookingCancellation.email,
        validBookingCancellation.name,
        validBookingCancellation.lockerNumber,
        validBookingCancellation.floorNumber,
        validBookingCancellation.startDate,
        validBookingCancellation.endDate,
        validBookingCancellation.keyStatus,
        validBookingCancellation.keyNumber,
        validBookingCancellation.adminBookingsPath,
      )
    })

    it('should return 400 for invalid keyStatus', async () => {
      /**
       * Verify validation for keyStatus enum.
       */
      const response = await request(app)
        .post('/notifications/booking/cancellation')
        .send({
          ...validBookingCancellation,
          keyStatus: 'invalid-status',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /notifications/booking/extension', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send booking extension notification', async () => {
      /**
       * Verify booking extension notification flow.
       * Mock service succeeds.
       */
      vi.mocked(bookingService.notifyBookingExtension).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/booking/extension')
        .send(validBookingExtension)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(bookingService.notifyBookingExtension).toHaveBeenCalledWith(
        validBookingExtension.userId,
        validBookingExtension.email,
        validBookingExtension.name,
        validBookingExtension.lockerNumber,
        validBookingExtension.floorNumber,
        validBookingExtension.originalEndDate,
        validBookingExtension.newEndDate,
        validBookingExtension.userBookingsPath,
        validBookingExtension.adminBookingsPath,
      )
    })

    it('should return 400 for missing fields', async () => {
      /**
       * Verify validation for required fields.
       */
      const response = await request(app)
        .post('/notifications/booking/extension')
        .send({ userId: sampleUserId })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /notifications/booking/key-return-reminder', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send key return reminder', async () => {
      /**
       * Verify key return reminder notification flow.
       * Mock service succeeds.
       */
      vi.mocked(bookingService.notifyKeyReturnReminder).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/booking/key-return-reminder')
        .send(validKeyReturnReminder)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(bookingService.notifyKeyReturnReminder).toHaveBeenCalledWith(
        validKeyReturnReminder.userId,
        validKeyReturnReminder.email,
        validKeyReturnReminder.name,
        validKeyReturnReminder.lockerNumber,
        validKeyReturnReminder.floorNumber,
        validKeyReturnReminder.startDate,
        validKeyReturnReminder.endDate,
        validKeyReturnReminder.keyNumber,
        validKeyReturnReminder.keyReturnPath,
      )
    })

    it('should return 400 for missing keyNumber', async () => {
      /**
       * Verify validation requires keyNumber.
       */
      const { keyNumber: _keyNumber, ...invalidRequest } = validKeyReturnReminder
      const response = await request(app)
        .post('/notifications/booking/key-return-reminder')
        .send(invalidRequest)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /notifications/booking/overdue-key-return', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send overdue key return notification', async () => {
      /**
       * Verify overdue key return notification flow.
       * Mock service succeeds.
       */
      vi.mocked(bookingService.notifyOverdueKeyReturn).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/booking/overdue-key-return')
        .send(validOverdueKeyReturn)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(bookingService.notifyOverdueKeyReturn).toHaveBeenCalledWith(
        validOverdueKeyReturn.adminId,
        validOverdueKeyReturn.userId,
        validOverdueKeyReturn.email,
        validOverdueKeyReturn.name,
        validOverdueKeyReturn.lockerNumber,
        validOverdueKeyReturn.floorNumber,
        validOverdueKeyReturn.startDate,
        validOverdueKeyReturn.endDate,
        validOverdueKeyReturn.keyNumber,
        validOverdueKeyReturn.keyReturnPath,
      )
    })

    it('should return 400 for missing adminId', async () => {
      /**
       * Verify validation requires adminId.
       */
      const { adminId: _adminId, ...invalidRequest } = validOverdueKeyReturn
      const response = await request(app)
        .post('/notifications/booking/overdue-key-return')
        .send(invalidRequest)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /notifications/waitlist/joined', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send waitlist joined notification', async () => {
      /**
       * Verify waitlist joined notification flow.
       * Mock service succeeds.
       */
      vi.mocked(waitlistService.notifyJoinedWaitingList).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/waitlist/joined')
        .send(validWaitlistJoined)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(waitlistService.notifyJoinedWaitingList).toHaveBeenCalledWith(
        validWaitlistJoined.userId,
        validWaitlistJoined.email,
        validWaitlistJoined.name,
        validWaitlistJoined.floorNumber,
        validWaitlistJoined.startDate,
        validWaitlistJoined.endDate,
      )
    })

    it('should return 400 for missing fields', async () => {
      /**
       * Verify validation for required fields.
       */
      const response = await request(app)
        .post('/notifications/waitlist/joined')
        .send({ userId: sampleUserId })

      expect(response.status).toBe(400)
    })

    it('should return 500 on service error', async () => {
      /**
       * Verify error handling.
       */
      vi.mocked(waitlistService.notifyJoinedWaitingList).mockRejectedValue(
        new Error('Email failed'),
      )

      const response = await request(app)
        .post('/notifications/waitlist/joined')
        .send(validWaitlistJoined)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /notifications/waitlist/removed', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send waitlist removed notification', async () => {
      /**
       * Verify waitlist removed notification flow.
       * Mock service succeeds.
       */
      vi.mocked(waitlistService.notifyRemovedFromWaitingList).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/waitlist/removed')
        .send(validWaitlistRemoved)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(waitlistService.notifyRemovedFromWaitingList).toHaveBeenCalledWith(
        validWaitlistRemoved.userId,
        validWaitlistRemoved.email,
        validWaitlistRemoved.name,
        validWaitlistRemoved.floorNumber,
        validWaitlistRemoved.startDate,
        validWaitlistRemoved.endDate,
      )
    })

    it('should return 400 for missing fields', async () => {
      /**
       * Verify validation for required fields.
       */
      const response = await request(app)
        .post('/notifications/waitlist/removed')
        .send({ email: 'test@example.com' })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /notifications/special-request/submitted', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send special request submitted notification', async () => {
      /**
       * Verify special request submitted notification flow.
       * Mock service succeeds.
       */
      vi.mocked(specialRequestService.notifySpecialRequestSubmitted).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/special-request/submitted')
        .send(validSpecialRequestSubmitted)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(specialRequestService.notifySpecialRequestSubmitted).toHaveBeenCalledWith(
        validSpecialRequestSubmitted.userId,
        validSpecialRequestSubmitted.email,
        validSpecialRequestSubmitted.name,
        validSpecialRequestSubmitted.floorNumber,
        validSpecialRequestSubmitted.endDate,
        validSpecialRequestSubmitted.requestId,
        validSpecialRequestSubmitted.userSpecialRequestsPath,
        validSpecialRequestSubmitted.adminSpecialRequestsPath,
      )
    })

    it('should handle null endDate for permanent allocation', async () => {
      /**
       * Verify handling of permanent allocation (null endDate).
       */
      vi.mocked(specialRequestService.notifySpecialRequestSubmitted).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/special-request/submitted')
        .send({
          ...validSpecialRequestSubmitted,
          endDate: null,
        })

      expect(response.status).toBe(200)
      expect(specialRequestService.notifySpecialRequestSubmitted).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        null,
        expect.anything(),
        expect.anything(),
        expect.anything(),
      )
    })

    it('should return 500 on service error', async () => {
      /**
       * Verify error handling.
       */
      vi.mocked(specialRequestService.notifySpecialRequestSubmitted).mockRejectedValue(
        new Error('Notification failed'),
      )

      const response = await request(app)
        .post('/notifications/special-request/submitted')
        .send(validSpecialRequestSubmitted)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /notifications/special-request/approved', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send special request approved notification', async () => {
      /**
       * Verify special request approved notification flow.
       * Mock service succeeds.
       */
      vi.mocked(specialRequestService.notifySpecialRequestApproved).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/special-request/approved')
        .send(validSpecialRequestApproved)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(specialRequestService.notifySpecialRequestApproved).toHaveBeenCalledWith(
        validSpecialRequestApproved.userId,
        validSpecialRequestApproved.email,
        validSpecialRequestApproved.name,
        validSpecialRequestApproved.floorNumber,
        validSpecialRequestApproved.endDate,
        validSpecialRequestApproved.requestId,
        validSpecialRequestApproved.userSpecialRequestsPath,
        validSpecialRequestApproved.createdBy,
      )
    })

    it('should handle null endDate for permanent allocation', async () => {
      /**
       * Verify handling of permanent allocation.
       */
      vi.mocked(specialRequestService.notifySpecialRequestApproved).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/special-request/approved')
        .send({
          ...validSpecialRequestApproved,
          endDate: null,
        })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /notifications/special-request/rejected', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully send special request rejected notification', async () => {
      /**
       * Verify special request rejected notification flow.
       * Mock service succeeds.
       */
      vi.mocked(specialRequestService.notifySpecialRequestRejected).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/special-request/rejected')
        .send(validSpecialRequestRejected)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(specialRequestService.notifySpecialRequestRejected).toHaveBeenCalledWith(
        validSpecialRequestRejected.userId,
        validSpecialRequestRejected.email,
        validSpecialRequestRejected.name,
        validSpecialRequestRejected.floorNumber,
        validSpecialRequestRejected.endDate,
        validSpecialRequestRejected.requestId,
        validSpecialRequestRejected.reason,
        validSpecialRequestRejected.userSpecialRequestsPath,
        validSpecialRequestRejected.createdBy,
      )
    })

    it('should handle null endDate for permanent allocation', async () => {
      /**
       * Verify handling of permanent allocation.
       */
      vi.mocked(specialRequestService.notifySpecialRequestRejected).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/special-request/rejected')
        .send({
          ...validSpecialRequestRejected,
          endDate: null,
        })

      expect(response.status).toBe(200)
    })

    it('should pass rejection reason to the service', async () => {
      /**
       * Verify that rejection reason is properly passed to the service.
       */
      vi.mocked(specialRequestService.notifySpecialRequestRejected).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/notifications/special-request/rejected')
        .send(validSpecialRequestRejected)

      expect(response.status).toBe(200)
      expect(specialRequestService.notifySpecialRequestRejected).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        validSpecialRequestRejected.reason,
        expect.anything(),
        expect.anything(), // createdBy
      )
    })

    it('should return 500 on service error', async () => {
      /**
       * Verify error handling.
       */
      vi.mocked(specialRequestService.notifySpecialRequestRejected).mockRejectedValue(
        new Error('Database error'),
      )

      const response = await request(app)
        .post('/notifications/special-request/rejected')
        .send(validSpecialRequestRejected)

      expect(response.status).toBe(500)
    })
  })
})
