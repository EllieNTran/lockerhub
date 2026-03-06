/**
 * Keys Types
 */

export type KeyStatus =
  | 'available'
  | 'awaiting_handover'
  | 'with_employee'
  | 'awaiting_return'
  | 'lost'
  | 'awaiting_replacement'

export interface Key {
  key_id: string
  key_number: string
  locker_id: string
  status: KeyStatus
  created_at: string
  updated_at: string
}

export interface CreateKeyData {
  key_number: string
  locker_id: string
  status?: KeyStatus
}

export interface UpdateKeyData {
  key_number?: string
  locker_id?: string
  status?: KeyStatus
}
