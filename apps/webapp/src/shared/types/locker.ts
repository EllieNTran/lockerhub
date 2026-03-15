export type LockerStatus = 'available' | 'occupied' | 'maintenance' | 'reserved'

export interface Locker {
  locker_id: string
  locker_number: string
  floor_id: string
  floor_number?: string
  location?: string
  status?: LockerStatus
  locker_status?: string
  x_coordinate?: number
  y_coordinate?: number
  key_number?: string
  key_status?: string
  created_at: string
  updated_at: string
}

export interface AvailableLocker extends Locker {
  is_available: boolean
  is_permanently_allocated: boolean
}
