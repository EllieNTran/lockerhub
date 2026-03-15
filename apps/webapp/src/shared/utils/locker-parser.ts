/**
 * Parse locker number to extract floor, zone, and locker ID
 * Format: [L|DL]{floor}-{zone}-{locker}
 * Examples: L02-02-01, DL11E-03-05
 */

export interface ParsedLockerNumber {
  prefix: string // "L" or "DL"
  floor: string // "02", "11E"
  zone: string // "02", "03"
  locker: string // "01", "05"
  isValid: boolean
}

export const parseLockerNumber = (lockerNumber: string): ParsedLockerNumber => {
  // Match pattern: (L|DL)(floor)-(zone)-(locker)
  const pattern = /^(L|DL)([^-]+)-([^-]+)-([^-]+)$/
  const match = lockerNumber.match(pattern)

  if (!match) {
    return {
      prefix: '',
      floor: '',
      zone: '',
      locker: '',
      isValid: false,
    }
  }

  return {
    prefix: match[1],
    floor: match[2],
    zone: match[3],
    locker: match[4],
    isValid: true,
  }
}

/**
 * Get zone ID from locker number
 */
export const getZoneFromLockerNumber = (lockerNumber: string): string | null => {
  const parsed = parseLockerNumber(lockerNumber)
  return parsed.isValid ? parsed.zone : null
}

/**
 * Get floor from locker number
 */
export const getFloorFromLockerNumber = (lockerNumber: string): string | null => {
  const parsed = parseLockerNumber(lockerNumber)
  return parsed.isValid ? parsed.floor : null
}

/**
 * Format locker display name (just the locker number part)
 */
export const getLockerDisplayNumber = (lockerNumber: string): string => {
  const parsed = parseLockerNumber(lockerNumber)
  return parsed.isValid ? parsed.locker : lockerNumber
}
