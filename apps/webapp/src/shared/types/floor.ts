export interface Floor {
  floor_id: string
  floor_number: string
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
}

export interface FloorClosure {
  closure_id: string
  start_date: string
  end_date: string
  reason: string | null
}

export interface FloorWithLockerCount extends Floor {
  total_lockers: number
  closures?: FloorClosure[] | null
}

export interface FloorQueue {
  floor_queue_id: number
  floor_id: string
  request_id: number
  created_at: string
}

export interface CreateFloorQueueData {
  floor_id: string
  request_id: number
}

export interface CreateFloorData {
  number: string
}

export interface UpdateFloorData {
  number?: string
}
