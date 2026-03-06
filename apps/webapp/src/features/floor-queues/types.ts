/**
 * Floor Queues Types
 */

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
