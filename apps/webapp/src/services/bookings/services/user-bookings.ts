import { apiClient } from '@/services/apiClient'
import type { Booking } from '@/types/booking'

export interface CreateBookingData {
  locker_id: string
  start_date: string
  end_date: string
}

export interface UpdateBookingData {
  new_start_date?: string
  new_end_date?: string
}

export interface ExtendBookingData {
  new_end_date: string
}

export interface ExtendBookingResponse {
  request_id: number
  status: string
}

export const getUserBookings = async (): Promise<Booking[]> => {
  const response = await apiClient.get<{ bookings: Booking[] }>('/bookings')
  return response.bookings
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
  return apiClient.put<Booking>(`/bookings/${bookingId}`, data)
}

export const extendBooking = async (
  bookingId: string,
  data: ExtendBookingData,
): Promise<ExtendBookingResponse> => {
  return apiClient.post<ExtendBookingResponse>(`/bookings/${bookingId}/extend`, data)
}

export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  return apiClient.put<Booking>(`/bookings/${bookingId}/cancel`, {})
}

export const deleteBooking = async (bookingId: string): Promise<void> => {
  return apiClient.delete<void>(`/bookings/${bookingId}`)
}

export const getBookingRule = async (ruleType: string): Promise<{ value: number }> => {
  return apiClient.get<{ value: number }>(`/bookings/booking-rule/${ruleType}`)
}
