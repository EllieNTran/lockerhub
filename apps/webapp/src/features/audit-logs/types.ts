/**
 * Audit Logs Types
 */

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'handover'
  | 'return'

export type EntityType = 'booking' | 'locker' | 'key' | 'request' | 'floor' | 'booking_rule'

export interface AuditLog {
  audit_log_id: string
  user_id: string | null
  action: AuditAction
  entity_type: EntityType
  entity_id: string | null
  reference: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  audit_date: string
}

export interface CreateAuditLogData {
  user_id?: string
  action: AuditAction
  entity_type: EntityType
  entity_id?: string
  reference?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
}

export interface AuditLogFilters {
  user_id?: string
  action?: AuditAction
  entity_type?: EntityType
  entity_id?: string
  start_date?: string
  end_date?: string
}
