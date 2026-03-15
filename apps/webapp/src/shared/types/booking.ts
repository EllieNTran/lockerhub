export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled' | 'expired'

export interface Booking {
  booking_id: string
  user_id: string
  locker_id: string
  locker_number: string
  floor_number: string
  start_date: string
  end_date: string | null
  status: BookingStatus
  special_request_id: number | null
  created_at: string
  updated_at: string
}
