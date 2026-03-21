import { apiClient } from '@/services/apiClient';
import type { Request } from '@/types/request';

export interface ReviewRequestData {
  status: 'approved' | 'rejected';
  admin_notes?: string;
  approved_start_date?: string;
  approved_end_date?: string;
}

/**
 * Get all special requests
 */
export async function getAllSpecialRequests(): Promise<Request[]> {
  const response = await apiClient.get<{ requests: Request[] }>('/admin/special-requests');
  return response.requests;
}

/**
 * Review special request
 */
export async function reviewSpecialRequest(requestId: string, data: ReviewRequestData): Promise<Request> {
  return apiClient.post<Request>(`/admin/special-requests/${requestId}/review`, data);
}
