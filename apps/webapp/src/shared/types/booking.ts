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

export interface AdminBookingDetail {
  booking_id: string
  user_id: string
  employee_name: string
  staff_number: string
  capability_name: string | null
  department_name: string | null
  email: string
  locker_number: string
  floor_number: string
  start_date: string
  end_date: string | null
  booking_status: BookingStatus
  key_number: string | null
  key_status: string | null
}
