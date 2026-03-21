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
  const response = await apiClient.get<{ rules: BookingRule[] }>('/admin/booking-rules');
  return response.rules;
}

/**
 * Update booking rules
 */
export async function updateBookingRules(rules: UpdateBookingRuleData[]): Promise<BookingRule[]> {
  const response = await apiClient.put<{ rules: BookingRule[]; message: string }>('/admin/booking-rules', { rules });
  return response.rules;
}

/**
 * Update floor status
 */
export async function updateFloorStatus(floorId: string, data: UpdateFloorStatusData): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/admin/booking-rules/floors/${floorId}/status`, data);
}
