/**
 * Unit tests for booking notification services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  notifyBookingConfirmation,
  notifyBookingCancellation,
  notifyBookingExtension,
  notifyKeyReturnReminder,
  notifyOverdueKeyReturn,
} from '../../src/services/bookings'
import * as sendEmail from '../../src/utils/send-email'
import * as notifications from '../../src/services/notifications'
import { sampleUserId } from '../fixtures'

vi.mock('../../src/utils/send-email')
vi.mock('../../src/services/notifications')

describe('Booking Notification Services', () => {
  const testEmail = 'test@example.com'
  const testName = 'John Doe'
  const testLockerNumber = 'DL10-01-05'
  const testFloorNumber = '10'
  const testStartDate = '2026-03-24'
  const testEndDate = '2026-03-28'
  const userBookingsPath = '/user/bookings'
  const adminBookingsPath = '/admin/bookings'
  const keyReturnPath = '/user/keys/return'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('notifyBookingConfirmation', () => {
    it('should send booking confirmation notifications and emails', async () => {
      /**
       * Verify booking confirmation notification and emails are sent.
       * Mock notification creation and email sending.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-201',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyBookingConfirmation(
        sampleUserId,
        testEmail,
        testName,
        testLockerNumber,
        testFloorNumber,
        testStartDate,
        testEndDate,
        userBookingsPath,
        adminBookingsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'booking',
        title: 'Booking Confirmed',
        adminTitle: `Booking created for Locker ${testLockerNumber}`,
        caption: `Your booking for Locker ${testLockerNumber} on Floor ${testFloorNumber} from ${testStartDate} to ${testEndDate} has been confirmed.`,
        type: 'info',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: sampleUserId,
      })

      expect(sendEmail.default).toHaveBeenCalledTimes(2)
      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          NAME: testName,
          LOCKER_NUMBER: testLockerNumber,
          FLOOR: testFloorNumber,
          START_DATE: testStartDate,
          END_DATE: testEndDate,
          BOOKINGS_LINK: expect.stringContaining(userBookingsPath),
        }),
        'locker-booking-confirmation-user',
        'User Booking Confirmation',
      )
      expect(sendEmail.default).toHaveBeenCalledWith(
        'fm@lockerhub.com',
        expect.objectContaining({
          USER_NAME: testName,
          USER_EMAIL: testEmail,
          ADMIN_BOOKINGS_LINK: expect.stringContaining(adminBookingsPath),
        }),
        'locker-booking-confirmation-admin',
        'Admin Booking Confirmation',
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
        notifyBookingConfirmation(
          sampleUserId,
          testEmail,
          testName,
          testLockerNumber,
          testFloorNumber,
          testStartDate,
          testEndDate,
          userBookingsPath,
          adminBookingsPath,
        ),
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('notifyBookingCancellation', () => {
    it('should send cancellation notification when user has key', async () => {
      /**
       * Verify cancellation notification includes key return instructions.
       * Mock notification creation and email sending.
       */
      const keyStatus = 'with_employee'
      const keyNumber = 'AA123'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-202',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyBookingCancellation(
        sampleUserId,
        testEmail,
        testName,
        testLockerNumber,
        testFloorNumber,
        testStartDate,
        testEndDate,
        keyStatus,
        keyNumber,
        adminBookingsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'booking',
        title: 'Booking Cancelled',
        adminTitle: `Booking cancelled for Locker ${testLockerNumber}`,
        caption: expect.stringContaining('cancelled'),
        type: 'info',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: sampleUserId,
      })

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          MESSAGE: expect.stringContaining('key AA123'),
        }),
        'locker-booking-cancellation-user',
        'User Booking Cancellation',
      )
      expect(sendEmail.default).toHaveBeenCalledWith(
        'fm@lockerhub.com',
        expect.objectContaining({
          MESSAGE: expect.stringContaining('key AA123'),
        }),
        'locker-booking-cancellation-admin',
        'Admin Booking Cancellation',
      )
    })

    it('should send cancellation notification when user does not have key', async () => {
      /**
       * Verify cancellation notification without key return instructions.
       * Mock notification creation and email sending.
       */
      const keyStatus = 'available'
      const keyNumber = 'AA123'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-203',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyBookingCancellation(
        sampleUserId,
        testEmail,
        testName,
        testLockerNumber,
        testFloorNumber,
        testStartDate,
        testEndDate,
        keyStatus,
        keyNumber,
        adminBookingsPath,
      )

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          MESSAGE: expect.stringContaining('No further action is required'),
        }),
        'locker-booking-cancellation-user',
        'User Booking Cancellation',
      )
    })
  })

  describe('notifyBookingExtension', () => {
    it('should send booking extension notifications and emails', async () => {
      /**
       * Verify booking extension notification and emails are sent.
       * Mock notification creation and email sending.
       */
      const originalEndDate = '2026-03-28'
      const newEndDate = '2026-04-05'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-204',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyBookingExtension(
        sampleUserId,
        testEmail,
        testName,
        testLockerNumber,
        testFloorNumber,
        originalEndDate,
        newEndDate,
        userBookingsPath,
        adminBookingsPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'booking',
        title: 'Booking Extended',
        adminTitle: `Booking extended for Locker ${testLockerNumber}`,
        caption: `Your booking for Locker ${testLockerNumber} has been extended until ${newEndDate}.`,
        type: 'success',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: sampleUserId,
      })

      expect(sendEmail.default).toHaveBeenCalledTimes(2)
      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          ORIGINAL_END_DATE: originalEndDate,
          NEW_END_DATE: newEndDate,
          BOOKINGS_LINK: expect.stringContaining(userBookingsPath),
        }),
        'extended-locker-booking-user',
        'Booking Extension',
      )
    })

    it('should handle email sending errors', async () => {
      /**
       * Verify error handling when email fails to send.
       * Mock email service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-205',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('SMTP timeout'))

      await expect(
        notifyBookingExtension(
          sampleUserId,
          testEmail,
          testName,
          testLockerNumber,
          testFloorNumber,
          '2026-03-28',
          '2026-04-05',
          userBookingsPath,
          adminBookingsPath,
        ),
      ).rejects.toThrow('SMTP timeout')
    })
  })

  describe('notifyKeyReturnReminder', () => {
    it('should send key return reminder notification and email', async () => {
      /**
       * Verify key return reminder notification and email are sent.
       * Mock notification creation and email sending.
       */
      const keyNumber = 'AA123'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-206',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyKeyReturnReminder(
        sampleUserId,
        testEmail,
        testName,
        testLockerNumber,
        testFloorNumber,
        testStartDate,
        testEndDate,
        keyNumber,
        keyReturnPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'key',
        title: 'Key Return Due Today',
        adminTitle: `Key return reminder for Locker ${testLockerNumber}`,
        caption: `The key ${keyNumber} for Locker ${testLockerNumber} on Floor ${testFloorNumber} is due for return by ${testEndDate}.`,
        type: 'warning',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: null,
      })

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          NAME: testName,
          KEY_NUMBER: keyNumber,
          KEY_RETURN_LINK: expect.stringContaining(keyReturnPath),
        }),
        'key-return-reminder-user',
        'Key Return Reminder',
      )
    })

    it('should handle notification creation errors', async () => {
      /**
       * Verify error handling when notification creation fails.
       * Mock notification service to throw error.
       */
      vi.spyOn(notifications, 'createNotification').mockRejectedValue(
        new Error('Database error'),
      )

      await expect(
        notifyKeyReturnReminder(
          sampleUserId,
          testEmail,
          testName,
          testLockerNumber,
          testFloorNumber,
          testStartDate,
          testEndDate,
          'AA123',
          keyReturnPath,
        ),
      ).rejects.toThrow('Database error')
    })
  })

  describe('notifyOverdueKeyReturn', () => {
    it('should send overdue key return notification and email', async () => {
      /**
       * Verify overdue key return notification and email are sent.
       * Mock notification creation and email sending.
       */
      const adminId = '99999999-9999-9999-9999-999999999999'
      const keyNumber = 'AA123'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-207',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockResolvedValue(undefined)

      await notifyOverdueKeyReturn(
        adminId,
        sampleUserId,
        testEmail,
        testName,
        testLockerNumber,
        testFloorNumber,
        testStartDate,
        testEndDate,
        keyNumber,
        keyReturnPath,
      )

      expect(notifications.createNotification).toHaveBeenCalledWith({
        entityType: 'key',
        title: 'Overdue Key Return',
        adminTitle: `Overdue key return for Locker ${testLockerNumber}`,
        caption: expect.stringContaining('overdue'),
        type: 'error',
        scope: 'user',
        userIds: [sampleUserId],
        createdBy: adminId,
      })

      expect(sendEmail.default).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          NAME: testName,
          KEY_NUMBER: keyNumber,
          KEY_RETURN_LINK: expect.stringContaining(keyReturnPath),
        }),
        'overdue-key-return-user',
        'Overdue Key Return',
      )
    })

    it('should handle email sending errors', async () => {
      /**
       * Verify error handling when email fails to send.
       * Mock email service to throw error.
       */
      const adminId = '99999999-9999-9999-9999-999999999999'

      vi.spyOn(notifications, 'createNotification').mockResolvedValue({
        success: true,
        notification_id: 'notif-208',
        message: 'Notification created successfully',
      })
      vi.spyOn(sendEmail, 'default').mockRejectedValue(new Error('Email service down'))

      await expect(
        notifyOverdueKeyReturn(
          adminId,
          sampleUserId,
          testEmail,
          testName,
          testLockerNumber,
          testFloorNumber,
          testStartDate,
          testEndDate,
          'AA123',
          keyReturnPath,
        ),
      ).rejects.toThrow('Email service down')
    })
  })
})
