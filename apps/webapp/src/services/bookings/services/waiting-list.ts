import { apiClient } from '@/services/apiClient'

export interface JoinFloorQueueData {
  floor_id: string
  start_date: string
  end_date: string
}

export interface JoinFloorQueueResponse {
  floor_queue_id: number
  request_id: number
  floor_number: string
}

export const joinFloorQueue = async (
  data: JoinFloorQueueData,
): Promise<JoinFloorQueueResponse> => {
  return apiClient.post<JoinFloorQueueResponse>('/bookings/waitlist/join', data)
}
