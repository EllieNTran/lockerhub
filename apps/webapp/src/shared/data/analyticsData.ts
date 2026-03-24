// ── Mock analytics data for admin dashboard ──────────────────────────────────

export interface DepartmentUsage {
  department: string;
  bookings: number;
  activeLockers: number;
  avgDurationDays: number;
}

export interface DailyUsage {
  date: string;
  bookings: number;
  returns: number;
}

export interface FloorPopularity {
  floor: string;
  totalBookings: number;
  currentOccupancy: number;
  peakHour: string;
}

// Department usage stats
export const departmentUsage: DepartmentUsage[] = [
  { department: 'Technology', bookings: 87, activeLockers: 34, avgDurationDays: 2.4 },
  { department: 'Finance', bookings: 64, activeLockers: 22, avgDurationDays: 3.1 },
  { department: 'Legal', bookings: 52, activeLockers: 18, avgDurationDays: 2.8 },
  { department: 'Operations', bookings: 45, activeLockers: 15, avgDurationDays: 1.9 },
  { department: 'Marketing', bookings: 38, activeLockers: 12, avgDurationDays: 2.2 },
  { department: 'HR', bookings: 29, activeLockers: 9, avgDurationDays: 3.5 },
  { department: 'Compliance', bookings: 24, activeLockers: 8, avgDurationDays: 2.6 },
  { department: 'Executive', bookings: 11, activeLockers: 5, avgDurationDays: 4.2 },
];

// Daily usage for the last 14 days
export const dailyUsage: DailyUsage[] = [
  { date: 'Feb 8', bookings: 18, returns: 14 },
  { date: 'Feb 9', bookings: 5, returns: 3 },
  { date: 'Feb 10', bookings: 22, returns: 19 },
  { date: 'Feb 11', bookings: 25, returns: 20 },
  { date: 'Feb 12', bookings: 21, returns: 18 },
  { date: 'Feb 13', bookings: 28, returns: 23 },
  { date: 'Feb 14', bookings: 8, returns: 6 },
  { date: 'Feb 15', bookings: 6, returns: 4 },
  { date: 'Feb 16', bookings: 24, returns: 21 },
  { date: 'Feb 17', bookings: 30, returns: 26 },
  { date: 'Feb 18', bookings: 27, returns: 22 },
  { date: 'Feb 19', bookings: 32, returns: 28 },
  { date: 'Feb 20', bookings: 29, returns: 25 },
  { date: 'Feb 21', bookings: 19, returns: 12 },
];

// Floor popularity
export const floorPopularity: FloorPopularity[] = [
  { floor: 'Floor 11 West', totalBookings: 142, currentOccupancy: 96, peakHour: '9:00 AM' },
  { floor: 'Floor 7', totalBookings: 68, currentOccupancy: 18, peakHour: '10:00 AM' },
  { floor: 'Floor 2', totalBookings: 61, currentOccupancy: 25, peakHour: '8:30 AM' },
  { floor: 'Floor 8', totalBookings: 55, currentOccupancy: 18, peakHour: '9:30 AM' },
  { floor: 'Floor 3', totalBookings: 52, currentOccupancy: 18, peakHour: '10:00 AM' },
  { floor: 'Floor 6', totalBookings: 48, currentOccupancy: 18, peakHour: '9:00 AM' },
  { floor: 'Floor 10 West', totalBookings: 44, currentOccupancy: 18, peakHour: '11:00 AM' },
  { floor: 'Floor 9', totalBookings: 41, currentOccupancy: 18, peakHour: '9:30 AM' },
  { floor: 'Floor 4', totalBookings: 38, currentOccupancy: 18, peakHour: '10:30 AM' },
  { floor: 'Floor 10 East', totalBookings: 35, currentOccupancy: 18, peakHour: '9:00 AM' },
  { floor: 'Floor 11 East', totalBookings: 18, currentOccupancy: 12, peakHour: '8:00 AM' },
];
