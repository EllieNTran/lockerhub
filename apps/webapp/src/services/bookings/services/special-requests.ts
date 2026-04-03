import { apiClient } from '@/services/apiClient'
import type { Request } from '@/types/request'

export interface CreateSpecialRequestData {
  floor_id: string
  locker_id?: string
  start_date: string
  end_date?: string
  justification: string
}

export interface CancelSpecialRequestData {
  request_id: number
}

export const getSpecialRequests = async (): Promise<Request[]> => {
  const response = await apiClient.get<{ requests: Request[] }>('/bookings/special-requests')
  return response.requests
}

export const createSpecialRequest = async (data: CreateSpecialRequestData): Promise<{ request_id: number }> => {
  return apiClient.post<{ request_id: number }>('/bookings/special-requests', data)
}

export const cancelSpecialRequest = async (request_id: number): Promise<{ request_id: number }> => {
  return apiClient.delete<{ request_id: number }>(`/bookings/special-requests/${request_id}`)
}
