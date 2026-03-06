/**
 * Lockers Types
 */

export type LockerStatus = 'available' | 'occupied' | 'maintenance' | 'reserved'

export interface Locker {
  locker_id: string
  locker_number: string
  floor_id: string
  status: LockerStatus
  created_at: string
  updated_at: string
}

export interface CreateLockerData {
  locker_number: string
  floor_id: string
  status?: LockerStatus
}

export interface UpdateLockerData {
  locker_number?: string
  floor_id?: string
  status?: LockerStatus
}
