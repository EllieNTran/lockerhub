export type RequestType = 'normal' | 'extension' | 'special'
export type RequestStatus = 'pending' | 'queued' | 'approved' | 'rejected' | 'cancelled'

export interface Request {
  request_id: number
  user_id: string
  floor_id: string | null
  locker_id?: string | null
  booking_id?: string | null
  start_date: string
  end_date?: string | null
  request_type: RequestType
  justification?: string | null
  status: RequestStatus
  created_at?: string
  reviewed_at?: string | null
  reviewed_by?: string | null
  floor_number?: string | null
  locker_number?: string | null
}
