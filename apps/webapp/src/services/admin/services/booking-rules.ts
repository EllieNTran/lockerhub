import { apiClient } from '@/services/apiClient';
import type { BookingRule } from '@/types/booking-rule';

export interface UpdateBookingRuleData {
  rule_id: string;
  rule_value: number | string;
}

export interface UpdateFloorStatusData {
  status: 'active' | 'maintenance' | 'closed';
}

/**
 * Get all booking rules
 */
export async function getBookingRules(): Promise<BookingRule[]> {
  return apiClient.get<BookingRule[]>('/admin/booking-rules');
}

/**
 * Update booking rules
 */
export async function updateBookingRules(rules: UpdateBookingRuleData[]): Promise<BookingRule[]> {
  return apiClient.put<BookingRule[]>('/admin/booking-rules', { rules });
}

/**
 * Update floor status
 */
export async function updateFloorStatus(floorId: string, data: UpdateFloorStatusData): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/admin/booking-rules/floors/${floorId}/status`, data);
}
