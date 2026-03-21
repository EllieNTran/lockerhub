import { format } from 'date-fns';

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Format a date with ordinal suffix (e.g., "Jan 24th, 2026")
 */
export function formatDateWithOrdinal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = format(d, 'MMM');
  const year = d.getFullYear();
  return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
}

/**
 * Format a date range with ordinals (e.g., "Jan 24th – Jan 26th, 2026")
 * If both dates are in the same year, only show year once at the end
 * If end date is null, returns "Permanent"
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string | null): string {
  if (!endDate) {
    return 'Permanent';
  }

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const startDay = start.getDate();
  const startMonth = format(start, 'MMM');
  const startYear = start.getFullYear();
  
  const endDay = end.getDate();
  const endMonth = format(end, 'MMM');
  const endYear = end.getFullYear();
  
  const startOrdinal = getOrdinalSuffix(startDay);
  const endOrdinal = getOrdinalSuffix(endDay);

  if (startYear === endYear) {
    return `${startMonth} ${startDay}${startOrdinal} – ${endMonth} ${endDay}${endOrdinal}, ${endYear}`;
  }

  return `${startMonth} ${startDay}${startOrdinal}, ${startYear} – ${endMonth} ${endDay}${endOrdinal}, ${endYear}`;
}
