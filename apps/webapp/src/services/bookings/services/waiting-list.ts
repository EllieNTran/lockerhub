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

export interface UserQueueEntry {
  floor_queue_id: number
  request_id: number
  start_date: string
  end_date: string
  created_at: string
  floor_id: string
  floor_number: string
}

export interface UserQueueEntriesResponse {
  queues: UserQueueEntry[]
}

export interface DeleteUserQueueEntryResponse {
  message: string
  floor_queue_id: number
}

export const joinFloorQueue = async (
  data: JoinFloorQueueData,
): Promise<JoinFloorQueueResponse> => {
  return apiClient.post<JoinFloorQueueResponse>('/bookings/waitlist/join', data)
}

export const getUserQueues = async (): Promise<UserQueueEntry[]> => {
  const response = await apiClient.get<UserQueueEntriesResponse>('/bookings/waitlist')
  return response.queues
}

export const deleteUserQueue = async (floorQueueId: number): Promise<DeleteUserQueueEntryResponse> => {
  return apiClient.delete<DeleteUserQueueEntryResponse>(`/bookings/waitlist/${floorQueueId}`)
}
