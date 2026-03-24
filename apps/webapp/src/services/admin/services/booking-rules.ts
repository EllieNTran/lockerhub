import { apiClient } from '@/services/apiClient';
import type { BookingRule } from '@/shared/types/booking-rule';
import type { FloorWithLockerCount } from '@/shared/types/floor';

export interface UpdateBookingRulesData {
  max_booking_duration?: number;
  max_extension?: number;
  advance_booking_window?: number;
  allow_same_day_bookings?: boolean;
}

export interface UpdateFloorStatusData {
  status: 'open' | 'closed';
  start_date?: string;
  end_date?: string;
  reason?: string;
}

/**
 * Get all booking rules
 */
export async function getBookingRules(): Promise<BookingRule[]> {
  const response = await apiClient.get<{ rules: BookingRule[] }>('/admin/booking-rules');
  return response.rules;
}

/**
 * Update booking rules
 */
export async function updateBookingRules(data: UpdateBookingRulesData): Promise<BookingRule[]> {
  const response = await apiClient.put<{ rules: BookingRule[]; message: string }>('/admin/booking-rules', data);
  return response.rules;
}

/**
 * Update floor status
 */
export async function updateFloorStatus(floorId: string, data: UpdateFloorStatusData): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/admin/booking-rules/floors/${floorId}/status`, data);
}

/**
 * Get all floors with locker counts
 */
export async function getAllFloors(): Promise<FloorWithLockerCount[]> {
  const response = await apiClient.get<{ floors: FloorWithLockerCount[] }>('/admin/booking-rules/floors');
  return response.floors;
}
