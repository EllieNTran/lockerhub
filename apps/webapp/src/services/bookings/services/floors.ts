import { apiClient } from '@/services/apiClient'

export interface Floor {
  floor_id: string
  floor_number: string
  status: string
  created_at: string
  updated_at: string
}

export interface FloorsResponse {
  floors: Floor[]
}

export const getFloors = async (): Promise<Floor[]> => {
  const response = await apiClient.get<FloorsResponse>('/bookings/floors')
  return response.floors
}
