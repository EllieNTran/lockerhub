/**
 * Bookings Types
 */

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled' | 'expired'

export interface Booking {
  booking_id: string
  user_id: string
  locker_id: string
  booking_start: string // DATE
  booking_end: string // DATE
  status: BookingStatus
  special_request_id: number | null
  created_at: string
  updated_at: string
}

export interface CreateBookingData {
  locker_id: string
  booking_start: string
  booking_end: string
}

export interface UpdateBookingData {
  booking_start?: string
  booking_end?: string
  status?: BookingStatus
}
