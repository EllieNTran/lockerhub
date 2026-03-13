import { apiClient } from '@/services/apiClient';
import type { Booking } from '@/shared/types/booking';
import type { CreateBookingData } from '@/services/bookings/services/user-bookings';

export interface CreateAdminBookingData extends CreateBookingData {
  user_id: string;
}

export interface HandoverData {
  key_id: string;
  handed_over_at: string;
}

export interface ReturnData {
  returned_at: string;
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
export async function getAllBookings(): Promise<Booking[]> {
  return apiClient.get<Booking[]>('/admin/bookings');
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
export async function confirmHandover(bookingId: string, data: HandoverData): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/admin/bookings/${bookingId}/handover`, data);
}

/**
 * Confirm key return
 */
export async function confirmReturn(bookingId: string, data: ReturnData): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/admin/bookings/${bookingId}/return`, data);
}
