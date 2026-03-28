/**
 * Test fixtures and mock data generators
 */

import { randomUUID } from 'crypto'
import { vi } from 'vitest'
import type {
  Notification,
  NotificationWithReadStatus,
  CreateNotificationRequest,
} from '../src/types'

/**
 * Sample UUIDs for consistent testing
 */
export const sampleUserId = '17ac6720-3737-479d-aacd-91380193866d'
export const sampleNotificationId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
export const sampleDepartmentId = '8f9e8c7d-6b5a-4e3d-2c1b-0a9f8e7d6c5b'
export const sampleFloorId = 'f1e2d3c4-b5a6-7890-1234-567890abcdef'

/**
 * Create a mock notification object
 */
export const createMockNotification = (
  overrides: Partial<Notification> = {},
): Notification => ({
  notification_id: randomUUID(),
  title: 'Test Notification',
  admin_title: 'Admin: Test Notification',
  caption: 'This is a test notification',
  type: 'info',
  entity_type: 'booking',
  scope: 'user',
  target_department_id: null,
  target_floor_id: null,
  created_at: new Date(),
  created_by: sampleUserId,
  ...overrides,
})

/**
 * Create a mock notification with read status
 */
export const createMockNotificationWithReadStatus = (
  overrides: Partial<NotificationWithReadStatus> = {},
): NotificationWithReadStatus => ({
  notification_id: randomUUID(),
  user_id: sampleUserId,
  title: 'Test Notification',
  admin_title: 'Admin: Test Notification',
  caption: 'This is a test notification',
  type: 'info',
  entity_type: 'booking',
  scope: 'user',
  target_department_id: null,
  target_floor_id: null,
  created_at: new Date(),
  created_by: sampleUserId,
  read: false,
  read_at: null,
  user_notification_created_at: new Date(),
  ...overrides,
})

/**
 * Create mock database query result
 */
export const createMockQueryResult = <T>(rows: T[]) => ({
  rows,
  rowCount: rows.length,
  command: 'SELECT',
  fields: [],
  oid: 0,
})

/**
 * Create a mock database client for transactions
 */
export const createMockDbClient = () => ({
  query: vi.fn(),
  release: vi.fn(),
})

/**
 * Create a mock database pool
 */
export const createMockDb = () => ({
  query: vi.fn(),
  getClient: vi.fn(() => Promise.resolve(createMockDbClient())),
  connect: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
})

/**
 * Create mock Resend email client
 */
export const createMockResend = () => ({
  emails: {
    send: vi.fn(() => Promise.resolve({ id: 'mock-email-id' })),
  },
})

/**
 * Sample notification creation request
 */
export const validNotificationRequest: CreateNotificationRequest = {
  title: 'System Update',
  adminTitle: 'Admin: System Update',
  caption: 'The system will undergo maintenance tonight',
  type: 'info',
  entityType: 'booking',
  scope: 'global',
  createdBy: sampleUserId,
}

/**
 * Sample user-scoped notification request
 */
export const userScopedNotificationRequest: CreateNotificationRequest = {
  title: 'Booking Confirmed',
  adminTitle: 'Admin: Booking Confirmed',
  caption: 'Your locker booking has been confirmed',
  type: 'success',
  entityType: 'booking',
  scope: 'user',
  userIds: [sampleUserId],
  createdBy: sampleUserId,
}

/**
 * Sample email data
 */
export const validPasswordResetEmail = {
  email: 'test@example.com',
  name: 'John Doe',
  resetLink: 'http://localhost:3001/reset-password?token=abc123',
}

export const validActivationEmail = {
  email: 'test@example.com',
  name: 'Jane Smith',
  activationLink: 'http://localhost:3001/activate?token=xyz789',
}

/**
 * Sample booking notification data
 */
export const validBookingConfirmation = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  lockerNumber: 'DL10-01-05',
  floorNumber: '10',
  startDate: '2026-03-24',
  endDate: '2026-03-28',
  userBookingsPath: '/user/bookings',
  adminBookingsPath: '/admin/bookings',
}

export const validBookingCancellation = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  lockerNumber: 'DL10-01-05',
  floorNumber: '10',
  startDate: '2026-03-24',
  endDate: '2026-03-28',
  keyStatus: 'available',
  keyNumber: 'K10-001',
  adminBookingsPath: '/admin/bookings',
}

export const validBookingExtension = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  lockerNumber: 'DL10-01-05',
  floorNumber: '10',
  originalEndDate: '2026-03-28',
  newEndDate: '2026-04-04',
  userBookingsPath: '/user/bookings',
  adminBookingsPath: '/admin/bookings',
}

export const validKeyReturnReminder = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  lockerNumber: 'DL10-01-05',
  floorNumber: '10',
  startDate: '2026-03-24',
  endDate: '2026-03-28',
  keyNumber: 'K10-001',
  keyReturnPath: '/user/bookings',
}

export const validOverdueKeyReturn = {
  adminId: sampleUserId,
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  lockerNumber: 'DL10-01-05',
  floorNumber: '10',
  startDate: '2026-03-24',
  endDate: '2026-03-28',
  keyNumber: 'K10-001',
  keyReturnPath: '/user/bookings',
}

/**
 * Sample waitlist notification data
 */
export const validWaitlistJoined = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  floorNumber: '10',
  startDate: '2026-03-24',
  endDate: '2026-03-28',
}

export const validWaitlistRemoved = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  floorNumber: '10',
  startDate: '2026-03-24',
  endDate: '2026-03-28',
}

/**
 * Sample special request notification data
 */
export const validSpecialRequestSubmitted = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  floorNumber: '10',
  endDate: '2026-04-24',
  requestId: 123,
  userSpecialRequestsPath: '/user/special-request',
  adminSpecialRequestsPath: '/admin/special-requests',
}

export const validSpecialRequestApproved = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  floorNumber: '10',
  endDate: '2026-04-24',
  requestId: 123,
  userSpecialRequestsPath: '/user/special-request',
}

export const validSpecialRequestRejected = {
  userId: sampleUserId,
  email: 'test@example.com',
  name: 'John Doe',
  floorNumber: '10',
  endDate: '2026-04-24',
  requestId: 123,
  reason: 'Request does not meet the criteria for extended allocation',
  userSpecialRequestsPath: '/user/special-request',
}
