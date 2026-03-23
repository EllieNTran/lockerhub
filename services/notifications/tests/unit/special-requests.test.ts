/**
 * Unit tests for special request notification services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  notifySpecialRequestSubmitted,
  notifySpecialRequestApproved,
  notifySpecialRequestRejected,
} from '../../src/services/special-requests'
import * as sendEmail from '../../src/utils/send-email'
import * as notifications from '../../src/services/notifications'
import { sampleUserId } from '../fixtures'

vi.mock('../../src/utils/send-email')
vi.mock('../../src/services/notifications')

describe('Special Request Notification Services', () => {
  const testEmail = 'test@example.com'
  const testName = 'John Doe'
  const testFloorNumber = '10'
  const testRequestId = 123
  const userSpecialRequestsPath = '/user/special-request'
  const adminSpecialRequestsPath = '/admin/special-requests'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('notifySpecialRequestSubmitted', () => {
    it('should send notifications and emails for extended allocation request', async () => {
      /**
       * Verify notification and emails are sent when user submits extended allocation request.
       * Mock notification creation and email sending.
       */
      const endDate = '2026-04-30'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-123',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifySpecialRequestSubmitted(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        endDate,
        testRequestId,
        userSpecialRequestsPath,
        adminSpecialRequestsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'request',
        title: 'Special Request Submitted',
        adminTitle: `New special request #${testRequestId}`,
        caption: `Your special request for extended locker allocation on Floor ${testFloorNumber} has been submitted and is pending review.`,
        type: 'info',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: sampleUserId,
      })

      expect(sendEmail.default).toHaveBeenCalledTimes(2)
      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        {
          NAME: testName,
          SPECIAL_REQUESTS_LINK: expect.stringContaining(userSpecialRequestsPath),
        },
        'special-request-user',
        'Special Request Submitted',
      )
      expect(sendEmail.default).toHaveBeenCalledWith(
        'fm@lockerhub.com',
        {
          ADMIN_SPECIAL_REQUESTS_LINK: expect.stringContaining(adminSpecialRequestsPath),
        },
        'special-request-admin',
        'New Special Request Submitted',
      )
    })

    it('should send notifications for permanent allocation request', async () => {
      /**
       * Verify notification mentions permanent when end date is null.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-124',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifySpecialRequestSubmitted(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        null,
        testRequestId,
        userSpecialRequestsPath,
        adminSpecialRequestsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: expect.stringContaining('permanent'),
        }),
      )
    })

    it('should handle notification creation errors', async () => {
      /**
       * Verify error handling when notification creation fails.
       * Mock notification service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockRejectedValue(
        new Error('Database connection failed'),
      )

      await expect(
        notifySpecialRequestSubmitted(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          '2026-04-30',
          testRequestId,
          userSpecialRequestsPath,
          adminSpecialRequestsPath,
        ),
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle email sending errors', async () => {
      /**
       * Verify error handling when email sending fails.
       * Mock email service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-125',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('SMTP server timeout'))

      await expect(
        notifySpecialRequestSubmitted(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          '2026-04-30',
          testRequestId,
          userSpecialRequestsPath,
          adminSpecialRequestsPath,
        ),
      ).rejects.toThrow('SMTP server timeout')
    })
  })

  describe('notifySpecialRequestApproved', () => {
    it('should send approval notification for extended allocation', async () => {
      /**
       * Verify approval notification and email are sent.
       * Mock notification creation and email sending.
       */
      const endDate = '2026-04-30'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-126',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifySpecialRequestApproved(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        endDate,
        testRequestId,
        userSpecialRequestsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'request',
        title: 'Special Request Approved',
        adminTitle: `Special request #${testRequestId} approved`,
        caption: `Your special request for extended locker allocation on Floor ${testFloorNumber} has been approved.`,
        type: 'success',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: null,
      })

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        {
          NAME: testName,
          SPECIAL_REQUESTS_LINK: expect.stringContaining(userSpecialRequestsPath),
        },
        'special-request-approved-user',
        'Special Request Approved',
      )
    })

    it('should send approval notification for permanent allocation', async () => {
      /**
       * Verify approval notification mentions permanent when end date is null.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-127',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifySpecialRequestApproved(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        null,
        testRequestId,
        userSpecialRequestsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: expect.stringContaining('permanent'),
        }),
      )
    })

    it('should handle errors during approval notification', async () => {
      /**
       * Verify error handling during approval notification.
       * Mock notification service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockRejectedValue(
        new Error('Failed to create notification'),
      )

      await expect(
        notifySpecialRequestApproved(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          '2026-04-30',
          testRequestId,
          userSpecialRequestsPath,
        ),
      ).rejects.toThrow('Failed to create notification')
    })
  })

  describe('notifySpecialRequestRejected', () => {
    it('should send rejection notification for extended allocation', async () => {
      /**
       * Verify rejection notification and email are sent.
       * Mock notification creation and email sending.
       */
      const endDate = '2026-04-30'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-128',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifySpecialRequestRejected(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        endDate,
        testRequestId,
        userSpecialRequestsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'request',
        title: 'Special Request Rejected',
        adminTitle: `Special request #${testRequestId} rejected`,
        caption: `Your special request for extended locker allocation on Floor ${testFloorNumber} has been rejected.`,
        type: 'error',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: null,
      })

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        {
          NAME: testName,
          SPECIAL_REQUESTS_LINK: expect.stringContaining(userSpecialRequestsPath),
        },
        'special-request-rejected-user',
        'Special Request Rejected',
      )
    })

    it('should send rejection notification for permanent allocation', async () => {
      /**
       * Verify rejection notification mentions permanent when end date is null.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-129',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifySpecialRequestRejected(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        null,
        testRequestId,
        userSpecialRequestsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: expect.stringContaining('permanent'),
        }),
      )
    })

    it('should handle errors during rejection notification', async () => {
      /**
       * Verify error handling during rejection notification.
       * Mock email service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-130',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('Email template not found'))

      await expect(
        notifySpecialRequestRejected(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          '2026-04-30',
          testRequestId,
          userSpecialRequestsPath,
        ),
      ).rejects.toThrow('Email template not found')
    })
  })
})
