/**
 * Mock Data for Development
 * Aligned with database schema types
 */

import type { Booking } from '@/features/bookings/types'
import type { Locker } from '@/features/lockers/types'
import type { User } from '@/features/users/types'
import type { Key } from '@/features/keys/types'
import type { Request } from '@/features/requests/types'
import type { Notification } from '@/features/notifications/types'
import type { Department } from '@/features/departments/types'
import type { Floor } from '@/features/floors/types'
import type { BookingRule } from '@/features/booking-rules/types'

/**
 * Floors
 */
export const mockFloors: Floor[] = [
  { floor_id: 'f1', number: 2 },
  { floor_id: 'f2', number: 3 },
  { floor_id: 'f3', number: 4 },
  { floor_id: 'f4', number: 6 },
  { floor_id: 'f5', number: 7 },
  { floor_id: 'f6', number: 8 },
  { floor_id: 'f7', number: 9 },
  { floor_id: 'f8', number: 10 },
  { floor_id: 'f9', number: 11 },
]

/**
 * Departments
 */
export const mockDepartments: Department[] = [
  { department_id: 'd1', name: 'Engineering', floor_id: 'f8' },
  { department_id: 'd2', name: 'Product', floor_id: 'f7' },
  { department_id: 'd3', name: 'Sales', floor_id: 'f5' },
  { department_id: 'd4', name: 'Marketing', floor_id: 'f6' },
  { department_id: 'd5', name: 'HR', floor_id: 'f1' },
]

/**
 * Users
 */
export const mockUsers: User[] = [
  {
    user_id: 'u1',
    first_name: 'John',
    last_name: 'Doe',
    staff_number: 'ST001234',
    department_id: 'd1',
    email: 'john.doe@company.com',
    role: 'user',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  },
  {
    user_id: 'u2',
    first_name: 'Jane',
    last_name: 'Smith',
    staff_number: 'ST002345',
    department_id: 'd2',
    email: 'jane.smith@company.com',
    role: 'admin',
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-01-10T09:00:00Z',
  },
  {
    user_id: 'u3',
    first_name: 'Alice',
    last_name: 'Johnson',
    staff_number: 'ST003456',
    department_id: 'd3',
    email: 'alice.johnson@company.com',
    role: 'user',
    created_at: '2025-02-01T11:00:00Z',
    updated_at: '2025-02-01T11:00:00Z',
  },
]

/**
 * Lockers
 */
export const mockLockers: Locker[] = [
  {
    locker_id: 'l1',
    locker_number: 'DL07-01-03',
    floor_id: 'f5',
    status: 'occupied',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-02-05T10:00:00Z',
  },
  {
    locker_id: 'l2',
    locker_number: 'DL03-02-05',
    floor_id: 'f2',
    status: 'reserved',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
  },
  {
    locker_id: 'l3',
    locker_number: 'DL10-01-01',
    floor_id: 'f8',
    status: 'available',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    locker_id: 'l4',
    locker_number: 'DL11-03-12',
    floor_id: 'f9',
    status: 'maintenance',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-02-20T14:00:00Z',
  },
]

/**
 * Keys
 */
export const mockKeys: Key[] = [
  {
    key_id: 'k1',
    key_number: 'K0001',
    locker_id: 'l1',
    status: 'with_employee',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-02-05T10:00:00Z',
  },
  {
    key_id: 'k2',
    key_number: 'K0002',
    locker_id: 'l2',
    status: 'awaiting_handover',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-02-15T08:00:00Z',
  },
  {
    key_id: 'k3',
    key_number: 'K0003',
    locker_id: 'l3',
    status: 'available',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

/**
 * Bookings
 */
export const mockBookings: Booking[] = [
  {
    booking_id: 'b1',
    user_id: 'u1',
    locker_id: 'l1',
    start_date: '2026-02-05',
    end_date: '2026-02-08',
    status: 'active',
    special_request_id: null,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-05T09:00:00Z',
  },
  {
    booking_id: 'b2',
    user_id: 'u1',
    locker_id: 'l2',
    start_date: '2026-02-15',
    end_date: '2026-02-18',
    status: 'upcoming',
    special_request_id: null,
    created_at: '2026-02-01T11:00:00Z',
    updated_at: '2026-02-01T11:00:00Z',
  },
  {
    booking_id: 'b3',
    user_id: 'u3',
    locker_id: 'l1',
    start_date: '2026-01-10',
    end_date: '2026-01-15',
    status: 'completed',
    special_request_id: null,
    created_at: '2026-01-05T10:00:00Z',
    updated_at: '2026-01-15T17:00:00Z',
  },
]

/**
 * Requests
 */
export const mockRequests: Request[] = [
  {
    request_id: 1,
    user_id: 'u1',
    floor_id: 'f2',
    locker_id: 'l2',
    booking_id: null,
    start_date: '2026-02-15',
    end_date: '2026-02-18',
    request_type: 'normal',
    justification: null,
    status: 'approved',
    created_at: '2026-01-25T10:00:00Z',
    reviewed_at: '2026-01-26T09:00:00Z',
    reviewed_by: 'u2',
  },
  {
    request_id: 2,
    user_id: 'u3',
    floor_id: 'f1',
    locker_id: null,
    booking_id: null,
    start_date: '2026-08-01',
    end_date: '2027-02-01',
    request_type: 'special',
    justification: 'Require ground-floor locker due to mobility restrictions.',
    status: 'pending',
    created_at: '2026-01-20T14:00:00Z',
    reviewed_at: null,
    reviewed_by: null,
  },
  {
    request_id: 3,
    user_id: 'u1',
    floor_id: null,
    locker_id: null,
    booking_id: 'b1',
    start_date: '2026-02-05',
    end_date: '2026-02-12',
    request_type: 'extension',
    justification: 'Project deadline extended, need locker for additional days.',
    status: 'approved',
    created_at: '2026-02-06T10:00:00Z',
    reviewed_at: '2026-02-06T11:00:00Z',
    reviewed_by: 'u2',
  },
]

/**
 * Notifications
 */
export const mockNotifications: Notification[] = [
  {
    notification_id: 'n1',
    user_id: 'u1',
    title: 'Key Return Due Tomorrow',
    caption: 'Your key for Locker DL07-01-03 (Floor 7) is due for return on Feb 8, 2026.',
    created_at: '2026-02-07T09:00:00Z',
    read: false,
    type: 'warning',
    scope: 'user',
  },
  {
    notification_id: 'n2',
    user_id: 'u3',
    title: 'Special Request Under Review',
    caption: 'Your medical locker request is being reviewed by the admin team.',
    created_at: '2026-01-20T14:30:00Z',
    read: false,
    type: 'info',
    scope: 'user',
  },
  {
    notification_id: 'n3',
    user_id: 'u1',
    title: 'Booking Confirmed',
    caption: 'Your booking for Locker DL03-02-05 (Floor 3) from Feb 15–18 has been confirmed.',
    created_at: '2026-02-01T11:05:00Z',
    read: true,
    type: 'success',
    scope: 'user',
  },
  {
    notification_id: 'n4',
    user_id: 'u1',
    title: 'Maintenance Notice',
    caption: 'Floor 11 lockers will be undergoing maintenance on Feb 20, 2026.',
    created_at: '2026-02-04T08:00:00Z',
    read: true,
    type: 'info',
    scope: 'floor',
  },
]

/**
 * Booking Rules
 */
export const mockBookingRules: BookingRule[] = [
  {
    booking_rule_id: 'br1',
    rule_type: 'max_duration',
    name: 'Standard Booking Duration',
    value: 3,
    start_date: null,
    end_date: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    created_by: 'u2',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    booking_rule_id: 'br2',
    rule_type: 'advance_booking_window',
    name: 'Advance Booking Window',
    value: 14,
    start_date: null,
    end_date: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    created_by: 'u2',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    booking_rule_id: 'br3',
    rule_type: 'max_extension',
    name: 'Maximum Extension Days',
    value: 2,
    start_date: null,
    end_date: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    created_by: 'u2',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    booking_rule_id: 'br4',
    rule_type: 'same_day_bookings',
    name: 'Same Day Bookings Allowed',
    value: 1,
    start_date: null,
    end_date: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    created_by: 'u2',
    updated_at: '2025-01-01T00:00:00Z',
  },
]
