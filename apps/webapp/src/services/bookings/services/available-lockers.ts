import { apiClient } from '@/services/apiClient'
import type { AvailableLocker } from '@/types/locker'

export interface GetAvailableLockersParams {
  floor_id: string
  start_date: string
  end_date: string
}

export interface AvailableLockersResponse {
  lockers: AvailableLocker[]
}

export const getAvailableLockers = async ({
  floor_id,
  start_date,
  end_date,
}: GetAvailableLockersParams): Promise<AvailableLocker[]> => {
  const response = await apiClient.get<AvailableLockersResponse>(
    `/bookings/lockers/available?floor_id=${floor_id}&start_date=${start_date}&end_date=${end_date}`,
  )
  return response.lockers
}
