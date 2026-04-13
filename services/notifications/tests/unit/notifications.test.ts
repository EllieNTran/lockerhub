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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      const result = await createNotification(departmentRequest)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lockerhub.notifications'),
        expect.arrayContaining([sampleDepartmentId]),
      )
    })

    it('should successfully create floor-scoped notification', async () => {
      /**
       * Verify notification creation for floor scope.
       * Mock database stores floor target.
       */
      const floorRequest = {
        ...validNotificationRequest,
        scope: 'floor' as const,
        floorId: '123e4567-e89b-12d3-a456-426614174000',
      }
      const mockNotification = createMockNotification({
        scope: 'floor',
        target_floor_id: floorRequest.floorId,
      })
      const mockClient = createMockDbClient()

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult([mockNotification])) // INSERT
        .mockResolvedValueOnce(undefined) // COMMIT

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      const result = await createNotification(floorRequest)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO lockerhub.notifications'),
        expect.arrayContaining([floorRequest.floorId]),
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      await expect(createNotification(validNotificationRequest)).rejects.toThrow('Database error')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should throw error for user scope without userIds', async () => {
      /**
       * Verify validation error when user scope lacks userIds.
       * Expects error to be thrown before database transaction.
       */
      const invalidRequest = {
        ...validNotificationRequest,
        scope: 'user' as const,
        // Missing userIds
      }
      const mockClient = createMockDbClient()
      mockClient.query.mockResolvedValueOnce(undefined) // BEGIN

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      await expect(createNotification(invalidRequest)).rejects.toThrow('userIds are required for user scope')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should throw error for user scope with empty userIds array', async () => {
      /**
       * Verify validation error when userIds array is empty.
       * Expects error to be thrown before database transaction.
       */
      const invalidRequest = {
        ...validNotificationRequest,
        scope: 'user' as const,
        userIds: [],
      }
      const mockClient = createMockDbClient()
      mockClient.query.mockResolvedValueOnce(undefined) // BEGIN

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      await expect(createNotification(invalidRequest)).rejects.toThrow('userIds are required for user scope')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    })

    it('should throw error for department scope without departmentId', async () => {
      /**
       * Verify validation error when department scope lacks departmentId.
       * Expects error to be thrown before database transaction.
       */
      const invalidRequest = {
        ...validNotificationRequest,
        scope: 'department' as const,
        // Missing departmentId
      }
      const mockClient = createMockDbClient()
      mockClient.query.mockResolvedValueOnce(undefined) // BEGIN

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      await expect(createNotification(invalidRequest)).rejects.toThrow('departmentId is required for department scope')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should throw error for floor scope without floorId', async () => {
      /**
       * Verify validation error when floor scope lacks floorId.
       * Expects error to be thrown before database transaction.
       */
      const invalidRequest = {
        ...validNotificationRequest,
        scope: 'floor' as const,
        // Missing floorId
      }
      const mockClient = createMockDbClient()
      mockClient.query.mockResolvedValueOnce(undefined) // BEGIN

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      await expect(createNotification(invalidRequest)).rejects.toThrow('floorId is required for floor scope')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should throw error for invalid scope', async () => {
      /**
       * Verify validation error for unsupported scope type.
       * Expects error to be thrown in default case.
       */
      const invalidRequest = {
        ...validNotificationRequest,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scope: 'invalid-scope' as any,
      }
      const mockClient = createMockDbClient()
      mockClient.query.mockResolvedValueOnce(undefined) // BEGIN

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      await expect(createNotification(invalidRequest)).rejects.toThrow('Invalid scope: invalid-scope')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should create notification with minimal required fields and apply default values', async () => {
      /**
       * Verify notification creation with only required fields (title, scope).
       * Test default values for optional fields: adminTitle, caption, type, entityType, createdBy.
       * Covers lines 130-137 default value branches in notifications.ts.
       */
      const minimalRequest = {
        title: 'Simple Notification',
        scope: 'global' as const,
        // All optional fields omitted: adminTitle, caption, type, entityType, createdBy
      }

      const mockNotification = createMockNotification({
        title: minimalRequest.title,
        scope: 'global',
      })
      const mockClient = createMockDbClient()

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(createMockQueryResult([mockNotification])) // INSERT notification
        .mockResolvedValueOnce(undefined) // COMMIT

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(db, 'getClient').mockResolvedValue(mockClient as any)

      const result = await createNotification(minimalRequest)

      expect(result.success).toBe(true)
      expect(result).toHaveProperty('notification_id')

      // Verify INSERT query was called with default values
      const insertCall = mockClient.query.mock.calls.find((call) => call[0].includes('INSERT INTO lockerhub.notifications'))
      expect(insertCall).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params = insertCall![1] as any[]

      // Expected defaults: adminTitle=null, caption=null, type='info', entityType=null, createdBy=null
      expect(params).toContain(null) // adminTitle
      expect(params).toContain(null) // caption
      expect(params).toContain('info') // type (default)
      expect(params).toContain(null) // entityType
      expect(params).toContain(null) // createdBy
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

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

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

      vi.spyOn(db, 'query').mockResolvedValue(mockResult)

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
        .mockResolvedValueOnce(createMockQueryResult(mockNotifications))
        .mockResolvedValueOnce(mockCountResult)

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
        .mockResolvedValueOnce(createMockQueryResult([]))
        .mockResolvedValueOnce(createMockQueryResult([{ count: '0' }]))

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
        .mockResolvedValueOnce(createMockQueryResult(mockNotifications))
        .mockResolvedValueOnce(createMockQueryResult([{ count: '1' }]))

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

    it('should handle empty unread count result with optional chaining default', async () => {
      /**
       * Verify unread count defaults to 0 when query returns empty rows.
       * This covers line 239: unreadResult.rows[0]?.count || '0'
       * Mock unread count query returns empty result set (no rows).
       */
      const mockNotifications = [
        createMockNotificationWithReadStatus({ read: true }),
      ]
      // Empty rows array to trigger optional chaining fallback
      const mockEmptyCountResult = createMockQueryResult([])

      vi.spyOn(db, 'query')
        .mockResolvedValueOnce(createMockQueryResult(mockNotifications))
        .mockResolvedValueOnce(mockEmptyCountResult) // Empty rows array

      const result = await getUserNotifications({ userId: sampleUserId })

      expect(result.notifications).toHaveLength(1)
      expect(result.unread).toBe(0) // Should default to 0 via || '0'
    })
  })
})
