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
  locker_id: string | null
  status: KeyStatus | null
  created_at: string | null
  updated_at: string | null
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
