/**
 * Floors Types
 */

export interface Floor {
  floor_id: string
  number: number
}

export interface CreateFloorData {
  number: number
}

export interface UpdateFloorData {
  number?: number
}
