export interface Floor {
  floor_id: string
  number: string
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
