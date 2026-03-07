/**
 * Bookings Types
 */

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled' | 'expired'

export interface Booking {
  booking_id: string
  user_id: string
  locker_id: string
  start_date: string // DATE
  end_date: string // DATE
  status: BookingStatus
  special_request_id: number | null
  created_at: string
  updated_at: string
}

export interface CreateBookingData {
  locker_id: string
  start_date: string
  end_date: string
}

export interface UpdateBookingData {
  start_date?: string
  end_date?: string
  status?: BookingStatus
}
