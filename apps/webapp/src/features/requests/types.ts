/**
 * Requests Types
 */

export type RequestType = 'normal' | 'extension' | 'special'
export type RequestStatus = 'pending' | 'queued' | 'approved' | 'rejected' | 'cancelled'

export interface Request {
  request_id: number
  user_id: string
  floor_id: string | null
  locker_id: string | null
  booking_id: string | null
  start_date: string // DATE
  end_date: string // DATE
  request_type: RequestType
  justification: string | null
  status: RequestStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface CreateRequestData {
  floor_id?: string
  locker_id?: string
  booking_id?: string
  start_date: string
  end_date: string
  request_type: RequestType
  justification?: string
}

export interface UpdateRequestData {
  floor_id?: string
  locker_id?: string
  start_date?: string
  end_date?: string
  justification?: string
  status?: RequestStatus
}

export interface ReviewRequestData {
  status: 'approved' | 'rejected'
  reviewed_by: string
}
