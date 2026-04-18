/**
 * Test fixtures and mock data generators
 */

import { randomUUID } from 'crypto'
import { vi } from 'vitest'
import type { User, DecodedToken } from '../src/types'

/**
 * Sample UUIDs for consistent testing
 */
export const sampleUserId = '17ac6720-3737-479d-aacd-91380193866d'
export const sampleDepartmentId = '8f9e8c7d-6b5a-4e3d-2c1b-0a9f8e7d6c5b'

/**
 * Create a mock user object
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  user_id: randomUUID(),
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  password_hash: '$2a$10$XQnMVSkuCKPVQIxY9e8Rl.uJ8x7qJgzR9x1K1rX5Y6Q7z8Y9a0b1c', // bcrypt hash of 'password123'
  role: 'user',
  staff_number: 'STF001',
  department_id: randomUUID(),
  office: 'Room 101',
  is_pre_registered: false,
  account_activated: true,
  has_seen_tutorial: false,
  created_at: new Date(),
  ...overrides,
})

/**
 * Create a mock pre-registered user
 */
export const createMockPreRegisteredUser = (overrides: Partial<User> = {}): User => ({
  user_id: randomUUID(),
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  password_hash: null,
  role: 'user',
  staff_number: 'STF002',
  department_id: randomUUID(),
  office: 'Room 202',
  is_pre_registered: true,
  account_activated: false,
  has_seen_tutorial: false,
  created_at: new Date(),
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
 * Create mock notifications client
 * Similar to mock_notifications_client in Python tests
 */
export const createMockNotificationsClient = () => ({
  sendWelcomeEmail: vi.fn(() => Promise.resolve({ success: true })),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve({ success: true })),
  sendActivationEmail: vi.fn(() => Promise.resolve({ success: true })),
})

/**
 * Create a mock decoded token
 * For testing JWT token verification
 */
export const createMockDecodedToken = (overrides: Partial<DecodedToken> = {}): DecodedToken => ({
  userId: sampleUserId,
  email: 'test@example.com',
  role: 'user',
  departmentId: sampleDepartmentId,
  scope: 'access',
  iss: 'lockerhub-auth',
  aud: ['lockerhub-api'],
  jti: randomUUID(),
  sub: sampleUserId,
  nbf: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
  iat: Math.floor(Date.now() / 1000),
  ...overrides,
})

/**
 * Sample credentials for testing
 */
export const validCredentials = {
  email: 'test@example.com',
  password: 'password123',
}

export const validSignupData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'securePassword123!',
  staffNumber: 'STF001',
  departmentId: sampleDepartmentId,
  office: 'Room 101',
}
