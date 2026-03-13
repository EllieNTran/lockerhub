export type NotificationType = 'info' | 'warning' | 'error' | 'success'
export type NotificationScope = 'user' | 'department' | 'floor' | 'global'

import type { EntityType } from './audit'

export type { EntityType }

export interface Notification {
  notification_id: string
  user_id: string
  title: string
  caption: string | null
  entity_type: EntityType | null
  created_at: string
  read: boolean
  type: NotificationType
  scope: NotificationScope
}
