import { query, getClient } from '../connectors/db'
import logger from '../logger'
import type {
  CreateNotificationRequest,
  CreateNotificationResponse,
  MarkAsReadRequest,
  MarkAsReadResponse,
  GetNotificationsRequest,
  GetNotificationsResponse,
  Notification,
  NotificationWithReadStatus,
} from '../types'

const CREATE_NOTIFICATION_QUERY = `
  INSERT INTO lockerhub.notifications (title, admin_title, caption, type, entity_type, scope, target_department_id, target_floor_id, created_by)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING notification_id, title, admin_title, caption, type, entity_type, scope, target_department_id, target_floor_id, created_at, created_by
`

const MARK_AS_READ_QUERY = `
  INSERT INTO lockerhub.user_notifications (user_id, notification_id, read, read_at)
  VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, notification_id) 
  DO UPDATE SET 
    read = TRUE, 
    read_at = CURRENT_TIMESTAMP
  WHERE lockerhub.user_notifications.read = FALSE
  RETURNING user_id, notification_id
`

const GET_USER_NOTIFICATIONS_QUERY = `
  SELECT DISTINCT
    n.notification_id,
    $1 as user_id,
    n.title,
    n.admin_title,
    n.caption,
    n.type,
    n.entity_type,
    n.scope,
    n.target_department_id,
    n.target_floor_id,
    n.created_at,
    n.created_by,
    COALESCE(un.read, FALSE) as read,
    un.read_at,
    COALESCE(un.created_at, n.created_at) as user_notification_created_at
  FROM lockerhub.notifications n
  LEFT JOIN lockerhub.user_notifications un 
    ON n.notification_id = un.notification_id AND un.user_id = $1
  LEFT JOIN lockerhub.users u ON u.user_id = $1
  LEFT JOIN (
    SELECT DISTINCT b.user_id, l.floor_id
    FROM lockerhub.bookings b
    INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    WHERE b.status NOT IN ('cancelled', 'expired')
  ) user_floors ON user_floors.user_id = $1
  WHERE 
    (n.scope = 'user' AND un.user_id = $1)
    OR (n.scope = 'department' AND n.target_department_id = u.department_id)
    OR (n.scope = 'floor' AND n.target_floor_id = user_floors.floor_id)
    OR (n.scope = 'global')
`

const COUNT_UNREAD_NOTIFICATIONS_QUERY = `
  SELECT COUNT(DISTINCT n.notification_id) as count
  FROM lockerhub.notifications n
  LEFT JOIN lockerhub.user_notifications un 
    ON n.notification_id = un.notification_id AND un.user_id = $1
  LEFT JOIN lockerhub.users u ON u.user_id = $1
  LEFT JOIN (
    SELECT DISTINCT b.user_id, l.floor_id
    FROM lockerhub.bookings b
    INNER JOIN lockerhub.lockers l ON b.locker_id = l.locker_id
    WHERE b.status NOT IN ('cancelled', 'expired')
  ) user_floors ON user_floors.user_id = $1
  WHERE 
    (
      (n.scope = 'user' AND un.user_id = $1)
      OR (n.scope = 'department' AND n.target_department_id = u.department_id)
      OR (n.scope = 'floor' AND n.target_floor_id = user_floors.floor_id)
      OR (n.scope = 'global')
    )
    AND COALESCE(un.read, FALSE) = FALSE
`

/**
 * Create a notification and assign it to specific users based on scope
 */
export const createNotification = async (
  request: CreateNotificationRequest,
): Promise<CreateNotificationResponse> => {
  const client = await getClient()

  try {
    await client.query('BEGIN')

    let targetDepartmentId = null
    let targetFloorId = null

    switch (request.scope) {
    case 'user':
      if (!request.userIds || request.userIds.length === 0) {
        throw new Error('userIds are required for user scope')
      }
      break
    case 'department':
      if (!request.departmentId) {
        throw new Error('departmentId is required for department scope')
      }
      targetDepartmentId = request.departmentId
      break
    case 'floor':
      if (!request.floorId) {
        throw new Error('floorId is required for floor scope')
      }
      targetFloorId = request.floorId
      break
    case 'global':
      break
    default:
      throw new Error(`Invalid scope: ${request.scope}`)
    }

    const notificationResult = await client.query<Notification>(
      CREATE_NOTIFICATION_QUERY,
      [
        request.title,
        request.adminTitle || null,
        request.caption || null,
        request.type || 'info',
        request.entityType || null,
        request.scope,
        targetDepartmentId,
        targetFloorId,
        request.createdBy || null,
      ],
    )

    const notification = notificationResult.rows[0]

    if (request.scope === 'user' && request.userIds && request.userIds.length > 0) {
      const values = request.userIds
        .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
        .join(', ')

      const params = request.userIds.flatMap((userId) => [userId, notification.notification_id])

      await client.query(
        `INSERT INTO lockerhub.user_notifications (user_id, notification_id)
         VALUES ${values}`,
        params,
      )
    }

    await client.query('COMMIT')

    logger.info(
      {
        notificationId: notification.notification_id,
        scope: request.scope,
        targetDepartmentId,
        targetFloorId,
      },
      'Notification created successfully',
    )

    return {
      notification_id: notification.notification_id,
      success: true,
      message: 'Notification created successfully',
    }
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error({ error, request }, 'Failed to create notification')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Mark a notification as read for a user
 * Creates user_notification record if it doesn't exist (for department/floor/global notifications)
 */
export const markAsRead = async (request: MarkAsReadRequest): Promise<MarkAsReadResponse> => {
  try {
    const result = await query(
      MARK_AS_READ_QUERY,
      [request.userId, request.notificationId],
    )

    if (result.rowCount === 0) {
      logger.warn(
        { userId: request.userId, notificationId: request.notificationId },
        'Notification not found or already read',
      )
      return {
        success: false,
        message: 'Notification not found or already marked as read',
      }
    }

    logger.info(
      { userId: request.userId, notificationId: request.notificationId },
      'Notification marked as read',
    )

    return {
      success: true,
      message: 'Notification marked as read',
    }
  } catch (error) {
    logger.error({ error, request }, 'Failed to mark notification as read')
    throw error
  }
}

/**
 * Get all notifications for a user based on scope
 */
export const getUserNotifications = async (
  request: GetNotificationsRequest,
): Promise<GetNotificationsResponse> => {
  try {
    const unreadFilter = request.unreadOnly ? 'AND COALESCE(un.read, FALSE) = FALSE' : ''

    const result = await query<NotificationWithReadStatus>(
      `${GET_USER_NOTIFICATIONS_QUERY} ${unreadFilter} ORDER BY n.created_at DESC`,
      [request.userId],
    )

    const unreadResult = await query<{ count: string }>(
      COUNT_UNREAD_NOTIFICATIONS_QUERY,
      [request.userId],
    )

    const unreadCount = parseInt(unreadResult.rows[0]?.count || '0', 10)

    logger.info(
      { userId: request.userId, total: result.rows.length, unread: unreadCount },
      'Retrieved user notifications',
    )

    return {
      notifications: result.rows,
      total: result.rows.length,
      unread: unreadCount,
    }
  } catch (error) {
    logger.error({ error, request }, 'Failed to get user notifications')
    throw error
  }
}
