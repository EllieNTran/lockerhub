import type { Request } from 'express'

export interface User {
  userId: string
  email: string
  role: string
  departmentId?: string | null
  scope: string
}

export interface DecodedToken {
  userId: string
  email: string
  role: string
  departmentId?: string | null
  scope: string
  iss: string
  aud: string[]
  jti: string
  sub: string
  nbf: number
  exp: number
  iat: number
}

export interface JWK {
  kty: string
  kid: string
  use: string
  alg: string
  n: string
  e: string
}

export interface JWKS {
  keys: JWK[]
}

export interface AppError extends Error {
  status?: number
  statusCode?: number
  code?: string
}

export interface AppErrorOptions {
  message: string
  statusCode?: number
  code?: string | null
  isOperational?: boolean
}

export interface AuthenticatedRequest extends Request {
  user?: User
}

export interface JWTVerifyOptions {
  audience?: string | string[]
  issuer?: string
}

export interface SendPasswordResetEmailRequest {
  email: string
  name: string
  resetLink: string
}

export interface SendPasswordResetEmailResponse {
  success: boolean
  message: string
}

export interface SendActivationEmailRequest {
  email: string
  name: string
  activationLink: string
}

export interface SendActivationEmailResponse {
  success: boolean
  message: string
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
  command: string;
  fields: unknown[];
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success'
export type NotificationScope = 'user' | 'department' | 'floor' | 'global'
export type EntityType = 'booking' | 'locker' | 'key' | 'request' | 'floor' | 'booking_rule' | 'waiting_list'

export interface Notification {
  notification_id: string
  title: string
  admin_title: string
  caption: string | null
  type: NotificationType
  entity_type: EntityType | null
  scope: NotificationScope
  target_department_id: string | null
  target_floor_id: string | null
  created_at: Date
  created_by: string | null
}

export interface UserNotification {
  user_id: string
  notification_id: string
  read: boolean
  read_at: Date | null
  created_at: Date
}

export interface NotificationWithReadStatus extends Notification {
  user_id: string
  read: boolean
  read_at: Date | null
  user_notification_created_at: Date
}

export interface CreateNotificationRequest {
  title: string
  adminTitle?: string
  caption?: string
  type?: NotificationType
  entityType?: EntityType
  scope: NotificationScope
  createdBy?: string | null
  userIds?: string[]
  departmentId?: string
  floorId?: string
}

export interface CreateNotificationResponse {
  notification_id: string
  success: boolean
  message: string
}

export interface MarkAsReadRequest {
  userId: string
  notificationId: string
}

export interface MarkAsReadResponse {
  success: boolean
  message: string
}

export interface GetNotificationsRequest {
  userId: string
  unreadOnly?: boolean
}

export interface GetNotificationsResponse {
  notifications: NotificationWithReadStatus[]
  total: number
  unread: number
}
