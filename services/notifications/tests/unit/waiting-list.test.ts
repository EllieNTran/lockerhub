/**
 * Unit tests for waiting list notification services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  notifyJoinedWaitingList,
  notifyRemovedFromWaitingList,
} from '../../src/services/waiting-list'
import * as sendEmail from '../../src/utils/send-email'
import * as notifications from '../../src/services/notifications'
import { sampleUserId } from '../fixtures'

vi.mock('../../src/utils/send-email')
vi.mock('../../src/services/notifications')

describe('Waiting List Notification Services', () => {
  const testEmail = 'test@example.com'
  const testName = 'John Doe'
  const testFloorNumber = '10'
  const testStartDate = '2026-03-24'
  const testEndDate = '2026-03-28'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('notifyJoinedWaitingList', () => {
    it('should send notification and email when user joins waiting list', async () => {
      /**
       * Verify notification and email are sent when user joins waiting list.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-301',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyJoinedWaitingList(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        testStartDate,
        testEndDate,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'waiting_list',
        title: 'Joined Waiting List',
        adminTitle: `${testName} joined the waiting list for Floor ${testFloorNumber}`,
        caption: `You have successfully joined the waiting list for Floor ${testFloorNumber} from ${testStartDate} to ${testEndDate}.`,
        type: 'info',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: sampleUserId,
      })

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        {
          NAME: testName,
          FLOOR: testFloorNumber,
          START_DATE: testStartDate,
          END_DATE: testEndDate,
        },
        'joined-waiting-list-user',
        'Joined Waiting List',
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
        notifyJoinedWaitingList(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          testStartDate,
          testEndDate,
        ),
      ).rejects.toThrow('Database connection failed')

      expect(sendEmail.default).not.toHaveBeenCalled()
    })

    it('should handle email sending errors', async () => {
      /**
       * Verify error handling when email fails to send.
       * Mock email service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-302',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('SMTP server timeout'))

      await expect(
        notifyJoinedWaitingList(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          testStartDate,
          testEndDate,
        ),
      ).rejects.toThrow('SMTP server timeout')
    })

    it('should include correct date range in notification caption', async () => {
      /**
       * Verify notification caption includes correct date range.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-303',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyJoinedWaitingList(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        testStartDate,
        testEndDate,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: expect.stringContaining(`from ${testStartDate} to ${testEndDate}`),
        }),
      )
    })
  })

  describe('notifyRemovedFromWaitingList', () => {
    it('should send notification and email when user is removed from waiting list', async () => {
      /**
       * Verify notification and email are sent when user is removed from waiting list.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-304',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyRemovedFromWaitingList(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        testStartDate,
        testEndDate,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'waiting_list',
        title: 'Removed from Waiting List',
        adminTitle: `${testName} was removed from the waiting list for Floor ${testFloorNumber}`,
        caption: `You have been removed from the waiting list for Floor ${testFloorNumber} (${testStartDate} to ${testEndDate}) as you already have an active booking for these dates.`,
        type: 'info',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: sampleUserId,
      })

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        {
          NAME: testName,
          FLOOR: testFloorNumber,
          START_DATE: testStartDate,
          END_DATE: testEndDate,
        },
        'removed-from-waiting-list-user',
        'Removed from Waiting List',
      )
    })

    it('should include reason for removal in notification caption', async () => {
      /**
       * Verify notification caption explains why user was removed.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-305',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyRemovedFromWaitingList(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        testStartDate,
        testEndDate,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: expect.stringContaining('already have an active booking'),
        }),
      )
    })

    it('should handle notification creation errors', async () => {
      /**
       * Verify error handling when notification creation fails.
       * Mock notification service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockRejectedValue(
        new Error('Failed to create notification'),
      )

      await expect(
        notifyRemovedFromWaitingList(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          testStartDate,
          testEndDate,
        ),
      ).rejects.toThrow('Failed to create notification')

      expect(sendEmail.default).not.toHaveBeenCalled()
    })

    it('should handle email sending errors', async () => {
      /**
       * Verify error handling when email fails to send.
       * Mock email service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-306',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('Email template not found'))

      await expect(
        notifyRemovedFromWaitingList(
          sampleUserId,
          testEmail,
          testName,
          testFloorNumber,
          testStartDate,
          testEndDate,
        ),
      ).rejects.toThrow('Email template not found')
    })

    it('should send email with correct template data', async () => {
      /**
       * Verify email is sent with all required template variables.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-307',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyRemovedFromWaitingList(
        sampleUserId,
        testEmail,
        testName,
        testFloorNumber,
        testStartDate,
        testEndDate,
      )

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          NAME: testName,
          FLOOR: testFloorNumber,
          START_DATE: testStartDate,
          END_DATE: testEndDate,
        }),
        'removed-from-waiting-list-user',
        'Removed from Waiting List',
      )
    })
  })
})
