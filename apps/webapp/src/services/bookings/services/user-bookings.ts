import { apiClient } from '@/services/apiClient'
import type { Booking } from '@/shared/types/booking'

export interface CreateBookingData {
  locker_id: string
  start_date: string
  end_date: string
}

export interface UpdateBookingData {
  start_date?: string
  end_date?: string
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled' | 'expired'
}

export const getUserBookings = async (): Promise<Booking[]> => {
  return apiClient.get<Booking[]>('/bookings/user')
}

export const getBookingById = async (bookingId: string): Promise<Booking> => {
  return apiClient.get<Booking>(`/bookings/${bookingId}`)
}

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  return apiClient.post<Booking>('/bookings', data)
}

export const updateBooking = async (
  bookingId: string,
  data: UpdateBookingData,
): Promise<Booking> => {
  return apiClient.patch<Booking>(`/bookings/${bookingId}`, data)
}

export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  return apiClient.patch<Booking>(`/bookings/${bookingId}`, {
    status: 'cancelled',
  })
}

export const deleteBooking = async (bookingId: string): Promise<void> => {
  return apiClient.delete<void>(`/bookings/${bookingId}`)
}
