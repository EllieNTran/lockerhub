/**
 * Unit tests for notification services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createNotification, markAsRead, getUserNotifications } from '../../src/services/notifications'
import * as db from '../../src/connectors/db'
import {
  createMockNotification,
  createMockNotificationWithReadStatus,
  createMockQueryResult,
  createMockDbClient,
  validNotificationRequest,
  userScopedNotificationRequest,
  sampleUserId,
  sampleNotificationId,
  sampleDepartmentId,
} from '../fixtures'

vi.mock('../../src/connectors/db')

describe('Notification Services', () => {
  describe('createNotification', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully create a global notification', async () => {
      /**
       * Verify successful notification creation with global scope.
       * Mock database returns created notification.
       */
      const mockNotification = createMockNotification({
        title: validNotificationRequest.title,
        scope: 'global',
      })
      const mockClient = createMockDbClient()

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult([mockNotification])) // INSERT notification
        .mockResolvedValueOnce(undefined) // COMMIT

      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      const result = await createNotification(validNotificationRequest)

      expect(result).toHaveProperty('notification_id')
      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should successfully create user-scoped notification', async () => {
      /**
       * Verify notification creation for specific users.
       * Mock database creates notification and user notification entries.
       */
      const mockNotification = createMockNotification({
        title: userScopedNotificationRequest.title,
        scope: 'user',
      })
      const mockClient = createMockDbClient()

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult([mockNotification])) // INSERT notification
        .mockResolvedValueOnce(createMockQueryResult([{ user_id: sampleUserId }])) // INSERT user_notifications
        .mockResolvedValueOnce(undefined) // COMMIT

      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      const result = await createNotification(userScopedNotificationRequest)

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('notification_id')
    })

    it('should successfully create department-scoped notification', async () => {
      /**
       * Verify notification creation for department scope.
       * Mock database stores department target.
       */
      const departmentRequest = {
        ...validNotificationRequest,
        scope: 'department' as const,
        departmentId: sampleDepartmentId,
      }
      const mockNotification = createMockNotification({
        scope: 'department',
        target_department_id: sampleDepartmentId,
      })
      const mockClient = createMockDbClient()

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult([mockNotification])) // INSERT
        .mockResolvedValueOnce(undefined) // COMMIT

      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      const result = await createNotification(departmentRequest)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lockerhub.notifications'),
        expect.arrayContaining([sampleDepartmentId]),
      )
    })

    it('should rollback transaction on error', async () => {
      /**
       * Verify transaction rollback on database error.
       * Mock database throws error during insertion.
       */
      const mockClient = createMockDbClient()

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')) // INSERT fails

      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      await expect(createNotification(validNotificationRequest)).rejects.toThrow('Database error')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })

  describe('markAsRead', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully mark notification as read', async () => {
      /**
       * Verify marking notification as read.
       * Mock database updates user_notification record.
       */
      const mockResult = createMockQueryResult([
        { user_id: sampleUserId, notification_id: sampleNotificationId },
      ])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult as any)

      const result = await markAsRead({
        userId: sampleUserId,
        notificationId: sampleNotificationId,
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('marked as read')
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lockerhub.user_notifications'),
        [sampleUserId, sampleNotificationId],
      )
    })

    it('should handle already read notification', async () => {
      /**
       * Verify handling when notification was already read.
       * Mock database returns empty result (no update).
       * Service returns success: false for already-read notifications.
       */
      const mockResult = createMockQueryResult([])

      vi.spyOn(db, 'query').mockResolvedValue(mockResult as any)

      const result = await markAsRead({
        userId: sampleUserId,
        notificationId: sampleNotificationId,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('already marked as read')
    })

    it('should handle database errors', async () => {
      /**
       * Verify error handling during mark as read.
       * Mock database throws error.
       */
      vi.spyOn(db, 'query').mockRejectedValue(new Error('Database connection failed'))

      await expect(
        markAsRead({
          userId: sampleUserId,
          notificationId: sampleNotificationId,
        }),
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('getUserNotifications', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should successfully retrieve user notifications', async () => {
      /**
       * Verify retrieval of user notifications.
       * Mock database returns notifications with read status.
       */
      const mockNotifications = [
        createMockNotificationWithReadStatus({ read: false }),
        createMockNotificationWithReadStatus({ read: true }),
      ]
      const mockCountResult = createMockQueryResult([{ count: '1' }])

      vi.spyOn(db, 'query')
        .mockResolvedValueOnce(createMockQueryResult(mockNotifications) as any)
        .mockResolvedValueOnce(mockCountResult as any)

      const result = await getUserNotifications({ userId: sampleUserId })

      expect(result.notifications).toHaveLength(2)
      expect(result.unread).toBe(1)
      expect(result.notifications[0]).toHaveProperty('read')
    })

    it('should return empty array for user with no notifications', async () => {
      /**
       * Verify handling of user with no notifications.
       * Mock database returns empty result.
       */
      vi.spyOn(db, 'query')
        .mockResolvedValueOnce(createMockQueryResult([]) as any)
        .mockResolvedValueOnce(createMockQueryResult([{ count: '0' }]) as any)

      const result = await getUserNotifications({ userId: sampleUserId })

      expect(result.notifications).toHaveLength(0)
      expect(result.unread).toBe(0)
    })

    it('should filter by unread only when requested', async () => {
      /**
       * Verify filtering for unread notifications only.
       * Mock database returns only unread notifications.
       */
      const mockNotifications = [
        createMockNotificationWithReadStatus({ read: false }),
      ]

      vi.spyOn(db, 'query')
        .mockResolvedValueOnce(createMockQueryResult(mockNotifications) as any)
        .mockResolvedValueOnce(createMockQueryResult([{ count: '1' }]) as any)

      const result = await getUserNotifications({
        userId: sampleUserId,
        unreadOnly: true,
      })

      expect(result.notifications).toHaveLength(1)
      expect(result.notifications[0].read).toBe(false)
    })

    it('should handle database errors', async () => {
      /**
       * Verify error handling during retrieval.
       * Mock database throws error.
       */
      vi.spyOn(db, 'query').mockRejectedValue(new Error('Query failed'))

      await expect(getUserNotifications({ userId: sampleUserId })).rejects.toThrow('Query failed')
    })
  })
})
