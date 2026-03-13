export type RuleType =
  | 'max_duration'
  | 'max_extension'
  | 'advance_booking_window'
  | 'same_day_bookings'

export interface BookingRule {
  booking_rule_id: string
  rule_type: RuleType
  name: string
  value: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  created_by: string
  updated_at: string
}

export interface CreateBookingRuleData {
  rule_type: RuleType
  name: string
  value: number
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export interface UpdateBookingRuleData {
  rule_type?: RuleType
  name?: string
  value?: number
  start_date?: string
  end_date?: string
  is_active?: boolean
}
