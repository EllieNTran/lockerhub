import { apiClient } from '@/services/apiClient';
import type { Booking, AdminBookingDetail } from '@/types/booking';
import type { CreateBookingData } from '@/services/bookings/services/user-bookings';

export interface CreateAdminBookingData extends CreateBookingData {
  user_id: string;
  locker_id: string;
  start_date: string;
  end_date: string;
}

/**
 * Create booking for user (admin)
 */
export async function createAdminBooking(data: CreateAdminBookingData): Promise<Booking> {
  return apiClient.post<Booking>('/admin/bookings', data);
}

/**
 * Get all bookings
 */
export async function getAllBookings(): Promise<AdminBookingDetail[]> {
  const response = await apiClient.get<{ bookings: AdminBookingDetail[] }>('/admin/bookings');
  return response.bookings;
}

/**
 * Cancel booking (admin)
 */
export async function cancelBooking(bookingId: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/admin/bookings/${bookingId}/cancel`);
}

/**
 * Confirm key handover
 */
export async function confirmHandover(bookingId: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/admin/bookings/${bookingId}/handover`);
}

/**
 * Confirm key return
 */
export async function confirmReturn(bookingId: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/admin/bookings/${bookingId}/return`);
}
