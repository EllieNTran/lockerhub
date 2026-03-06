/**
 * Notifications Types
 */

export type NotificationType = 'info' | 'warning' | 'error' | 'success'
export type NotificationScope = 'user' | 'department' | 'floor' | 'global'

export interface Notification {
  notification_id: string
  user_id: string
  title: string
  caption: string | null
  created_at: string
  read: boolean
  type: NotificationType
  scope: NotificationScope
}

export interface CreateNotificationData {
  user_id: string
  title: string
  caption?: string
  type?: NotificationType
  scope?: NotificationScope
}

export interface UpdateNotificationData {
  read?: boolean
}

export interface MarkAsReadData {
  notification_ids: string[]
}
